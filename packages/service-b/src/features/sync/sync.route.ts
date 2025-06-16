import { Router } from 'express';
import { ExternalService } from '../../services/external.service';
import { SyncController } from './sync.controller';

const router = Router();

const externalService = new ExternalService();
const syncController = new SyncController(externalService);

// Synchronization endpoints
router.get('/user/:userId', (req, res) => syncController.syncUser(req, res));
router.get('/orders/:userId', (req, res) => syncController.syncUserOrders(req, res));
router.get('/all-users', (req, res) => syncController.syncAllUsers(req, res));
router.get('/health-check', (req, res) => syncController.checkExternalServices(req, res));
router.get('/stats-comparison', (req, res) => syncController.compareStats(req, res));
router.post('/validate-consistency', (req, res) => syncController.validateDataConsistency(req, res));

export default router;