import { getDb } from '../db/database';

export interface Stokvel {
  id: string;
  name: string;
  description: string | null;
  founder_id: string;
  settings: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStokvelInput {
  name: string;
  description?: string;
  settings?: {
    contributionAmount?: number;
    contributionFrequency?: 'weekly' | 'monthly' | 'yearly';
    payoutRotation?: 'rotational' | 'random' | 'fixed';
    maxMembers?: number;
  };
}

export class StokvelService {
  static create(userId: string, input: CreateStokvelInput): Stokvel {
    const db = getDb();
    
    const settings = JSON.stringify({
      contributionAmount: input.settings?.contributionAmount || 0,
      contributionFrequency: input.settings?.contributionFrequency || 'monthly',
      payoutRotation: input.settings?.payoutRotation || 'rotational',
      maxMembers: input.settings?.maxMembers || 50,
      createdAt: new Date().toISOString()
    });
    
    const stmt = db.prepare(`
      INSERT INTO stokvels (name, description, founder_id, settings)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `);
    
    const stokvel = stmt.get(input.name, input.description || null, userId, settings) as Stokvel;
    
    const memberStmt = db.prepare(`
      INSERT INTO stokvel_members (user_id, stokvel_id, role)
      VALUES (?, ?, ?)
    `);
    memberStmt.run(userId, stokvel.id, 'FOUNDER');
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'CREATE_STOKVEL', 'stokvel', stokvel.id, JSON.stringify({ name: input.name }));
    
    return stokvel;
  }
  
  static getUserStokvels(userId: string): any[] {
    const db = getDb();
    
    const stmt = db.prepare(`
      SELECT 
        s.*,
        COUNT(DISTINCT sm.user_id) as member_count,
        u.email as founder_email
      FROM stokvels s
      JOIN stokvel_members sm ON s.id = sm.stokvel_id
      JOIN users u ON s.founder_id = u.id
      WHERE sm.user_id = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    
    return stmt.all(userId);
  }
  
  static getById(stokvelId: string, userId: string): any {
    const db = getDb();
    
    const accessCheck = db.prepare(`
      SELECT * FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, userId);
    
    if (!accessCheck) {
      throw new Error('You do not have access to this stokvel');
    }
    
    const stokvel = db.prepare(`
      SELECT 
        s.id, s.name, s.description, s.founder_id, s.settings, s.created_at, s.updated_at,
        u.email as founder_email,
        COUNT(DISTINCT sm.user_id) as member_count
      FROM stokvels s
      JOIN users u ON s.founder_id = u.id
      LEFT JOIN stokvel_members sm ON s.id = sm.stokvel_id
      WHERE s.id = ?
      GROUP BY s.id
    `).get(stokvelId);
    
    const members = db.prepare(`
      SELECT 
        u.id, u.email, u.role as user_role,
        sm.role as member_role, sm.joined_at
      FROM stokvel_members sm
      JOIN users u ON sm.user_id = u.id
      WHERE sm.stokvel_id = ?
      ORDER BY sm.joined_at ASC
    `).all(stokvelId);
    
    return {
      ...(stokvel as any),
      members: members
    };
  }
  
  static update(stokvelId: string, userId: string, updates: Partial<CreateStokvelInput>): Stokvel {
    const db = getDb();
    
    const roleCheck = db.prepare(`
      SELECT role FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, userId);
    
    if (!roleCheck || (roleCheck as any).role !== 'FOUNDER') {
      throw new Error('Only the founder can update stokvel settings');
    }
    
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    if (updates.name) {
      updateFields.push('name = ?');
      updateValues.push(updates.name);
    }
    
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(updates.description);
    }
    
    if (updates.settings) {
      const current = db.prepare('SELECT settings FROM stokvels WHERE id = ?').get(stokvelId) as any;
      const currentSettings = JSON.parse(current.settings);
      const newSettings = { ...currentSettings, ...updates.settings };
      updateFields.push('settings = ?');
      updateValues.push(JSON.stringify(newSettings));
    }
    
    if (updateFields.length === 0) {
      throw new Error('No updates provided');
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(stokvelId);
    
    const stmt = db.prepare(`
      UPDATE stokvels 
      SET ${updateFields.join(', ')}
      WHERE id = ?
      RETURNING *
    `);
    
    const updated = stmt.get(...updateValues) as Stokvel;
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'UPDATE_STOKVEL', 'stokvel', stokvelId, JSON.stringify(updates));
    
    return updated;
  }
  
  static delete(stokvelId: string, userId: string): void {
    const db = getDb();
    
    const roleCheck = db.prepare(`
      SELECT role FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, userId);
    
    if (!roleCheck || (roleCheck as any).role !== 'FOUNDER') {
      throw new Error('Only the founder can delete a stokvel');
    }
    
    const stokvel = db.prepare('SELECT name FROM stokvels WHERE id = ?').get(stokvelId) as any;
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'DELETE_STOKVEL', 'stokvel', stokvelId, JSON.stringify({ name: stokvel?.name }));
    
    db.prepare('DELETE FROM stokvels WHERE id = ?').run(stokvelId);
  }

  static clone(stokvelId: string, userId: string): Stokvel {
    const db = getDb();
    
    const accessCheck = db.prepare(`
      SELECT * FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, userId);
    
    if (!accessCheck) {
      throw new Error('You do not have access to this stokvel');
    }
    
    const sourceStokvel = db.prepare(`
      SELECT name, description, settings FROM stokvels WHERE id = ?
    `).get(stokvelId) as any;
    
    if (!sourceStokvel) {
      throw new Error('Source stokvel not found');
    }
    
    const settings = JSON.parse(sourceStokvel.settings);
    const cloneName = `${sourceStokvel.name} (Clone)`;
    
    const insertStmt = db.prepare(`
      INSERT INTO stokvels (name, description, founder_id, settings)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `);
    
    const clonedStokvel = insertStmt.get(
      cloneName,
      sourceStokvel.description,
      userId,
      JSON.stringify(settings)
    ) as Stokvel;
    
    const memberStmt = db.prepare(`
      INSERT INTO stokvel_members (user_id, stokvel_id, role)
      VALUES (?, ?, ?)
    `);
    memberStmt.run(userId, clonedStokvel.id, 'FOUNDER');
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'CLONE_STOKVEL', 'stokvel', clonedStokvel.id, JSON.stringify({
      source_id: stokvelId,
      source_name: sourceStokvel.name,
      clone_name: cloneName
    }));
    
    return clonedStokvel;
  }

  static addMember(stokvelId: string, userId: string, email: string, role: string = 'MEMBER'): any {
    const db = getDb();
    
    const permissionCheck = db.prepare(`
      SELECT role FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, userId);
    
    if (!permissionCheck) {
      throw new Error('You do not have access to this stokvel');
    }
    
    const userRole = (permissionCheck as any).role;
    if (userRole !== 'FOUNDER' && userRole !== 'ADMIN') {
      throw new Error('Only founder and admins can add members');
    }
    
    const userToAdd = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!userToAdd) {
      throw new Error(`User with email ${email} not found. Please register first.`);
    }
    
    const targetUserId = (userToAdd as any).id;
    
    const existingMember = db.prepare(`
      SELECT * FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, targetUserId);
    
    if (existingMember) {
      throw new Error('User is already a member of this stokvel');
    }
    
    const memberCount = db.prepare(`
      SELECT COUNT(*) as count FROM stokvel_members WHERE stokvel_id = ?
    `).get(stokvelId) as any;
    
    const stokvel = db.prepare('SELECT settings, name FROM stokvels WHERE id = ?').get(stokvelId) as any;
    const settings = JSON.parse(stokvel.settings);
    const maxMembers = settings.maxMembers || 50;
    
    if (memberCount.count >= maxMembers) {
      throw new Error(`Cannot add member. Maximum ${maxMembers} members reached.`);
    }
    
    const stmt = db.prepare(`
      INSERT INTO stokvel_members (user_id, stokvel_id, role)
      VALUES (?, ?, ?)
      RETURNING *
    `);
    
    const newMember = stmt.get(targetUserId, stokvelId, role);
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'ADD_MEMBER', 'stokvel_member', stokvelId, JSON.stringify({
      member_email: email,
      role: role,
      stokvel_name: stokvel.name
    }));
    
    return newMember;
  }

  static removeMember(stokvelId: string, userId: string, memberId: string): void {
    const db = getDb();
    
    const permissionCheck = db.prepare(`
      SELECT role FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, userId);
    
    if (!permissionCheck) {
      throw new Error('You do not have access to this stokvel');
    }
    
    const userRole = (permissionCheck as any).role;
    if (userRole !== 'FOUNDER' && userRole !== 'ADMIN') {
      throw new Error('Only founder and admins can remove members');
    }
    
    const memberToRemove = db.prepare(`
      SELECT role FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, memberId);
    
    if (!memberToRemove) {
      throw new Error('Member not found');
    }
    
    if ((memberToRemove as any).role === 'FOUNDER') {
      throw new Error('Cannot remove the founder of the stokvel');
    }
    
    db.prepare(`
      DELETE FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).run(stokvelId, memberId);
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'REMOVE_MEMBER', 'stokvel_member', stokvelId, JSON.stringify({
      member_id: memberId
    }));
  }

  static updateMemberRole(stokvelId: string, userId: string, memberId: string, newRole: string): void {
    const db = getDb();
    
    const permissionCheck = db.prepare(`
      SELECT role FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, userId);
    
    if (!permissionCheck) {
      throw new Error('You do not have access to this stokvel');
    }
    
    if ((permissionCheck as any).role !== 'FOUNDER') {
      throw new Error('Only the founder can update member roles');
    }
    
    const memberToUpdate = db.prepare(`
      SELECT role FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, memberId);
    
    if ((memberToUpdate as any).role === 'FOUNDER') {
      throw new Error('Cannot change the founder\'s role');
    }
    
    db.prepare(`
      UPDATE stokvel_members 
      SET role = ? 
      WHERE stokvel_id = ? AND user_id = ?
    `).run(newRole, stokvelId, memberId);
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'UPDATE_MEMBER_ROLE', 'stokvel_member', stokvelId, JSON.stringify({
      member_id: memberId,
      new_role: newRole
    }));
  }

  static getMembers(stokvelId: string, userId: string): any[] {
    const db = getDb();
    
    const accessCheck = db.prepare(`
      SELECT * FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, userId);
    
    if (!accessCheck) {
      throw new Error('You do not have access to this stokvel');
    }
    
    const members = db.prepare(`
      SELECT 
        u.id, u.email, u.role as user_role,
        sm.role as member_role, sm.joined_at
      FROM stokvel_members sm
      JOIN users u ON sm.user_id = u.id
      WHERE sm.stokvel_id = ?
      ORDER BY 
        CASE sm.role 
          WHEN 'FOUNDER' THEN 1
          WHEN 'ADMIN' THEN 2
          WHEN 'TREASURER' THEN 3
          ELSE 4
        END,
        sm.joined_at ASC
    `).all(stokvelId);
    
    return members;
  }

  static addContribution(stokvelId: string, userId: string, memberId: string, amount: number, dueDate: string): any {
    const db = getDb();
    
    const permissionCheck = db.prepare(`
      SELECT role FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, userId);
    
    if (!permissionCheck) {
      throw new Error('You do not have access to this stokvel');
    }
    
    const userRole = (permissionCheck as any).role;
    if (!['FOUNDER', 'ADMIN', 'TREASURER'].includes(userRole)) {
      throw new Error('Only founder, admins, and treasurers can record contributions');
    }
    
    const memberCheck = db.prepare(`
      SELECT * FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, memberId);
    
    if (!memberCheck) {
      throw new Error('Member does not belong to this stokvel');
    }
    
    const stokvel = db.prepare('SELECT settings, name FROM stokvels WHERE id = ?').get(stokvelId) as any;
    const settings = JSON.parse(stokvel.settings);
    const expectedAmount = settings.contributionAmount || 0;
    
    const stmt = db.prepare(`
      INSERT INTO contributions (stokvel_id, user_id, amount, status, due_date, paid_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      RETURNING *
    `);
    
    const status = amount >= expectedAmount ? 'PAID' : 'PARTIAL';
    const contribution = stmt.get(stokvelId, memberId, amount, status, dueDate);
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'ADD_CONTRIBUTION', 'contribution', stokvelId, JSON.stringify({
      member_id: memberId,
      amount: amount,
      due_date: dueDate,
      status: status,
      stokvel_name: stokvel.name
    }));
    
    return contribution;
  }

  static getContributions(stokvelId: string, userId: string): any[] {
    const db = getDb();
    
    const accessCheck = db.prepare(`
      SELECT * FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, userId);
    
    if (!accessCheck) {
      throw new Error('You do not have access to this stokvel');
    }
    
    const contributions = db.prepare(`
      SELECT 
        c.*,
        u.email as member_email,
        c.status,
        c.amount,
        c.due_date,
        c.paid_at,
        c.created_at
      FROM contributions c
      JOIN users u ON c.user_id = u.id
      WHERE c.stokvel_id = ?
      ORDER BY c.due_date DESC, c.created_at DESC
    `).all(stokvelId);
    
    return contributions;
  }

  static getMemberContributions(stokvelId: string, userId: string, memberId: string): any {
    const db = getDb();
    
    const accessCheck = db.prepare(`
      SELECT * FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, userId);
    
    if (!accessCheck) {
      throw new Error('You do not have access to this stokvel');
    }
    
    const member = db.prepare(`
      SELECT u.id, u.email, sm.role as member_role
      FROM stokvel_members sm
      JOIN users u ON sm.user_id = u.id
      WHERE sm.stokvel_id = ? AND sm.user_id = ?
    `).get(stokvelId, memberId);
    
    if (!member) {
      throw new Error('Member not found');
    }
    
    const contributions = db.prepare(`
      SELECT * FROM contributions 
      WHERE stokvel_id = ? AND user_id = ?
      ORDER BY due_date DESC, created_at DESC
    `).all(stokvelId, memberId);
    
    const totalPaid = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM contributions 
      WHERE stokvel_id = ? AND user_id = ? AND status = 'PAID'
    `).get(stokvelId, memberId) as any;
    
    const totalPending = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM contributions 
      WHERE stokvel_id = ? AND user_id = ? AND status = 'PENDING'
    `).get(stokvelId, memberId) as any;
    
    const stokvel = db.prepare('SELECT settings FROM stokvels WHERE id = ?').get(stokvelId) as any;
    const settings = JSON.parse(stokvel.settings);
    
    return {
      member: member,
      contributions: contributions,
      summary: {
        total_paid: totalPaid.total,
        total_pending: totalPending.total,
        expected_per_cycle: settings.contributionAmount || 0,
        frequency: settings.contributionFrequency || 'monthly'
      }
    };
  }

  static updateContributionStatus(contributionId: string, userId: string, status: string): any {
    const db = getDb();
    
    const contribution = db.prepare(`
      SELECT c.*, s.founder_id, s.id as stokvel_id
      FROM contributions c
      JOIN stokvels s ON c.stokvel_id = s.id
      WHERE c.id = ?
    `).get(contributionId) as any;
    
    if (!contribution) {
      throw new Error('Contribution not found');
    }
    
    const permissionCheck = db.prepare(`
      SELECT role FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(contribution.stokvel_id, userId);
    
    if (!permissionCheck) {
      throw new Error('You do not have access to this contribution');
    }
    
    const userRole = (permissionCheck as any).role;
    if (!['FOUNDER', 'ADMIN', 'TREASURER'].includes(userRole)) {
      throw new Error('Only founder, admins, and treasurers can update contributions');
    }
    
    const stmt = db.prepare(`
      UPDATE contributions 
      SET status = ?, paid_at = CASE WHEN ? = 'PAID' THEN CURRENT_TIMESTAMP ELSE paid_at END
      WHERE id = ?
      RETURNING *
    `);
    
    const updated = stmt.get(status, status, contributionId);
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'UPDATE_CONTRIBUTION', 'contribution', contributionId, JSON.stringify({
      status: status
    }));
    
    return updated;
  }

  static getNextRecipient(stokvelId: string, userId: string): any {
    const db = getDb();
    
    const accessCheck = db.prepare(`
      SELECT * FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, userId);
    
    if (!accessCheck) {
      throw new Error('You do not have access to this stokvel');
    }
    
    const lastPayout = db.prepare(`
      SELECT user_id, cycle_number 
      FROM payouts 
      WHERE stokvel_id = ? 
      ORDER BY cycle_number DESC, paid_at DESC 
      LIMIT 1
    `).get(stokvelId) as any;
    
    const members = db.prepare(`
      SELECT u.id, u.email, sm.role, sm.joined_at
      FROM stokvel_members sm
      JOIN users u ON sm.user_id = u.id
      WHERE sm.stokvel_id = ?
      ORDER BY sm.joined_at ASC
    `).all(stokvelId);
    
    if (members.length === 0) {
      throw new Error('No members found in this stokvel');
    }
    
    let nextMember: any;
    let nextCycle = 1;
    
    if (!lastPayout) {
      nextMember = members[0];
      nextCycle = 1;
    } else {
      const lastMemberIndex = members.findIndex((m: any) => m.id === lastPayout.user_id);
      const nextIndex = (lastMemberIndex + 1) % members.length;
      nextMember = members[nextIndex];
      nextCycle = lastPayout.cycle_number + 1;
    }
    
    const totalContributions = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM contributions 
      WHERE stokvel_id = ? AND user_id = ? AND status = 'PAID'
    `).get(stokvelId, nextMember.id) as any;
    
    const stokvel = db.prepare('SELECT settings, name FROM stokvels WHERE id = ?').get(stokvelId) as any;
    
    return {
      member: nextMember,
      cycle_number: nextCycle,
      total_contributions: totalContributions.total,
      expected_payout: totalContributions.total,
      stokvel_name: stokvel?.name
    };
  }

  static processPayout(stokvelId: string, userId: string): any {
    const db = getDb();
    
    const permissionCheck = db.prepare(`
      SELECT role FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, userId);
    
    if (!permissionCheck) {
      throw new Error('You do not have access to this stokvel');
    }
    
    const userRole = (permissionCheck as any).role;
    if (!['FOUNDER', 'ADMIN', 'TREASURER'].includes(userRole)) {
      throw new Error('Only founder, admins, and treasurers can process payouts');
    }
    
    const nextRecipient = this.getNextRecipient(stokvelId, userId);
    
    const existingPayout = db.prepare(`
      SELECT * FROM payouts 
      WHERE stokvel_id = ? AND user_id = ? AND cycle_number = ?
    `).get(stokvelId, nextRecipient.member.id, nextRecipient.cycle_number);
    
    if (existingPayout) {
      throw new Error(`Member ${nextRecipient.member.email} already received payout for cycle ${nextRecipient.cycle_number}`);
    }
    
    const stmt = db.prepare(`
      INSERT INTO payouts (stokvel_id, user_id, amount, cycle_number)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `);
    
    const result = stmt.get(stokvelId, nextRecipient.member.id, nextRecipient.expected_payout, nextRecipient.cycle_number) as any;
    
    if (!result) {
      throw new Error('Failed to record payout');
    }
    
    const payout = {
      id: result.id,
      stokvel_id: result.stokvel_id,
      user_id: result.user_id,
      amount: result.amount,
      cycle_number: result.cycle_number,
      paid_at: result.paid_at
    };
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'PROCESS_PAYOUT', 'payout', payout.id, JSON.stringify({
      stokvel_id: stokvelId,
      recipient_email: nextRecipient.member.email,
      amount: nextRecipient.expected_payout,
      cycle_number: nextRecipient.cycle_number,
      stokvel_name: nextRecipient.stokvel_name
    }));
    
    return {
      payout: payout,
      recipient: nextRecipient.member,
      cycle_number: nextRecipient.cycle_number,
      amount: nextRecipient.expected_payout
    };
  }

  static getPayoutHistory(stokvelId: string, userId: string): any[] {
    const db = getDb();
    
    const accessCheck = db.prepare(`
      SELECT * FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, userId);
    
    if (!accessCheck) {
      throw new Error('You do not have access to this stokvel');
    }
    
    const payouts = db.prepare(`
      SELECT 
        p.id,
        p.amount,
        p.cycle_number,
        p.paid_at,
        u.email as recipient_email
      FROM payouts p
      JOIN users u ON p.user_id = u.id
      WHERE p.stokvel_id = ?
      ORDER BY p.cycle_number DESC, p.paid_at DESC
    `).all(stokvelId);
    
    return payouts as any[];
  }

  static getFinancialSummary(stokvelId: string, userId: string): any {
    const db = getDb();
    
    const accessCheck = db.prepare(`
      SELECT * FROM stokvel_members 
      WHERE stokvel_id = ? AND user_id = ?
    `).get(stokvelId, userId);
    
    if (!accessCheck) {
      throw new Error('You do not have access to this stokvel');
    }
    
    const totalContributions = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM contributions 
      WHERE stokvel_id = ? AND status = 'PAID'
    `).get(stokvelId) as any;
    
    const totalPayouts = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payouts 
      WHERE stokvel_id = ?
    `).get(stokvelId) as any;
    
    const balance = totalContributions.total - totalPayouts.total;
    
    const memberBreakdown = db.prepare(`
      SELECT 
        u.id,
        u.email,
        COALESCE(SUM(c.amount), 0) as contributed,
        COALESCE((
          SELECT SUM(amount) FROM payouts 
          WHERE stokvel_id = ? AND user_id = u.id
        ), 0) as received
      FROM users u
      JOIN stokvel_members sm ON u.id = sm.user_id
      LEFT JOIN contributions c ON u.id = c.user_id AND c.stokvel_id = ? AND c.status = 'PAID'
      WHERE sm.stokvel_id = ?
      GROUP BY u.id, u.email
      ORDER BY contributed DESC
    `).all(stokvelId, stokvelId, stokvelId);
    
    const stokvel = db.prepare('SELECT settings, name FROM stokvels WHERE id = ?').get(stokvelId) as any;
    const settings = JSON.parse(stokvel?.settings || '{}');
    
    return {
      stokvel_name: stokvel?.name,
      total_contributions: totalContributions.total,
      total_payouts: totalPayouts.total,
      balance: balance,
      contribution_frequency: settings.contributionFrequency,
      expected_per_member: settings.contributionAmount,
      members: memberBreakdown
    };
  }
}