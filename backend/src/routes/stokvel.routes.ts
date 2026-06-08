import { Router } from 'express';
import { StokvelController } from '../controllers/stokvel.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const stokvelController = new StokvelController();

// All routes require authentication
router.use(authenticateToken);

// Stokvel CRUD
router.post('/', stokvelController.create.bind(stokvelController));
router.post('/:id/clone', stokvelController.clone.bind(stokvelController));
router.get('/', stokvelController.getUserStokvels.bind(stokvelController));
router.get('/:id', stokvelController.getById.bind(stokvelController));
router.put('/:id', stokvelController.update.bind(stokvelController));
router.delete('/:id', stokvelController.delete.bind(stokvelController));

// Member routes
router.post('/:id/members', stokvelController.addMember.bind(stokvelController));
router.get('/:id/members', stokvelController.getMembers.bind(stokvelController));
router.delete('/:id/members/:memberId', stokvelController.removeMember.bind(stokvelController));
router.put('/:id/members/:memberId/role', stokvelController.updateMemberRole.bind(stokvelController));

// Contribution routes
router.post('/:id/contributions', stokvelController.addContribution.bind(stokvelController));
router.get('/:id/contributions', stokvelController.getContributions.bind(stokvelController));
router.get('/:id/members/:memberId/contributions', stokvelController.getMemberContributions.bind(stokvelController));
router.put('/contributions/:contributionId/status', stokvelController.updateContributionStatus.bind(stokvelController));

// Payout routes
router.get('/:id/payouts/next', stokvelController.getNextRecipient.bind(stokvelController));
router.post('/:id/payouts/process', stokvelController.processPayout.bind(stokvelController));
router.get('/:id/payouts/history', stokvelController.getPayoutHistory.bind(stokvelController));
router.get('/:id/payouts/summary', stokvelController.getFinancialSummary.bind(stokvelController));

export default router;