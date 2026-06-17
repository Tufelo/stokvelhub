import { Response } from 'express';
import { StokvelService, CreateStokvelInput } from '../services/stokvel.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class StokvelController {
  async create(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { name, description, settings } = req.body;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Stokvel name is required' });
      }
      
      if (name.length > 100) {
        return res.status(400).json({ error: 'Name must be less than 100 characters' });
      }
      
      const input: CreateStokvelInput = {
        name: name.trim(),
        description: description?.trim(),
        settings
      };
      
      const stokvel = StokvelService.create(userId, input);
      
      res.status(201).json({
        success: true,
        message: 'Stokvel created successfully',
        data: stokvel
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  
  async getUserStokvels(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const stokvels = StokvelService.getUserStokvels(userId);
      
      const parsedStokvels = stokvels.map(s => ({
        ...s,
        settings: s.settings ? JSON.parse(s.settings) : {}
      }));
      
      res.json({
        success: true,
        count: parsedStokvels.length,
        data: parsedStokvels
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  
  async getById(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const id = req.params.id as string;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      if (!id) {
        return res.status(400).json({ error: 'Stokvel ID is required' });
      }
      
      const stokvel = StokvelService.getById(id, userId);
      
      const parsedStokvel = {
        ...stokvel,
        settings: stokvel.settings ? JSON.parse(stokvel.settings) : {}
      };
      
      res.json({
        success: true,
        data: parsedStokvel
      });
    } catch (error: any) {
      if (error.message === 'You do not have access to this stokvel') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(404).json({ error: error.message });
      }
    }
  }
  
  async update(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const id = req.params.id as string;
      const { name, description, settings } = req.body;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const updates: Partial<CreateStokvelInput> = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (settings) updates.settings = settings;
      
      const updated = StokvelService.update(id, userId, updates);
      
      res.json({
        success: true,
        message: 'Stokvel updated successfully',
        data: updated
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  
  async delete(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const id = req.params.id as string;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      StokvelService.delete(id, userId);
      
      res.json({
        success: true,
        message: 'Stokvel deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async clone(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const id = req.params.id as string;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      if (!id) {
        return res.status(400).json({ error: 'Stokvel ID is required' });
      }
      
      const clonedStokvel = StokvelService.clone(id, userId);
      
      const parsedClone = {
        ...clonedStokvel,
        settings: clonedStokvel.settings ? JSON.parse(clonedStokvel.settings) : {}
      };
      
      res.status(201).json({
        success: true,
        message: 'Stokvel cloned successfully',
        data: parsedClone
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async addMember(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const stokvelId = req.params.id as string;
      const { email, role } = req.body;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      const newMember = StokvelService.addMember(stokvelId, userId, email, role || 'MEMBER');
      
      res.json({
        success: true,
        message: 'Member added successfully',
        data: newMember
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async removeMember(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const stokvelId = req.params.id as string;
      const memberId = req.params.memberId as string;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      StokvelService.removeMember(stokvelId, userId, memberId);
      
      res.json({
        success: true,
        message: 'Member removed successfully'
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMembers(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const stokvelId = req.params.id as string;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const members = StokvelService.getMembers(stokvelId, userId);
      
      res.json({
        success: true,
        count: members.length,
        data: members
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateMemberRole(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const stokvelId = req.params.id as string;
      const memberId = req.params.memberId as string;
      const { role } = req.body;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      if (!role) {
        return res.status(400).json({ error: 'Role is required' });
      }
      
      StokvelService.updateMemberRole(stokvelId, userId, memberId, role);
      
      res.json({
        success: true,
        message: 'Member role updated successfully'
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async addContribution(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const stokvelId = req.params.id as string;
      const { memberId, amount, dueDate } = req.body;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      if (!memberId || !amount || !dueDate) {
        return res.status(400).json({ error: 'Member ID, amount, and due date are required' });
      }
      
      const contribution = StokvelService.addContribution(stokvelId, userId, memberId, amount, dueDate);
      
      res.json({
        success: true,
        message: 'Contribution recorded successfully',
        data: contribution
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getContributions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const stokvelId = req.params.id as string;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const contributions = StokvelService.getContributions(stokvelId, userId);
      
      res.json({
        success: true,
        count: contributions.length,
        data: contributions
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMemberContributions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const stokvelId = req.params.id as string;
      const memberId = req.params.memberId as string;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const result = StokvelService.getMemberContributions(stokvelId, userId, memberId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateContributionStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const contributionId = req.params.contributionId as string;
      const { status } = req.body;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
      
      const updated = StokvelService.updateContributionStatus(contributionId, userId, status);
      
      res.json({
        success: true,
        message: 'Contribution status updated successfully',
        data: updated
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getNextRecipient(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const stokvelId = req.params.id as string;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const nextRecipient = StokvelService.getNextRecipient(stokvelId, userId);
      
      res.json({
        success: true,
        data: nextRecipient
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async processPayout(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const stokvelId = req.params.id as string;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const payout = StokvelService.processPayout(stokvelId, userId);
      
      res.json({
        success: true,
        message: 'Payout processed successfully',
        data: payout
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getPayoutHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const stokvelId = req.params.id as string;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const history = StokvelService.getPayoutHistory(stokvelId, userId);
      
      res.json({
        success: true,
        count: history.length,
        data: history
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getFinancialSummary(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const stokvelId = req.params.id as string;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const summary = StokvelService.getFinancialSummary(stokvelId, userId);
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}