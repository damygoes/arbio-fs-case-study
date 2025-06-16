import { Router } from 'express';
import { ExternalService } from '../../services/external.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsService } from './analytics.service';


const router = Router();

const analyticsRepository = new AnalyticsRepository();
const externalService = new ExternalService();
const analyticsService = new AnalyticsService(analyticsRepository, externalService);
const analyticsController = new AnalyticsController(analyticsService);

// Analytics endpoints
router.get('/dashboard', (req, res) => analyticsController.getDashboard(req, res));
router.get('/metrics', (req, res) => analyticsController.getMetrics(req, res));
router.get('/insights', (req, res) => analyticsController.getInsights(req, res));
router.get('/reports/:type', (req, res) => analyticsController.generateReport(req, res));
router.get('/comparison', (req, res) => analyticsController.getPeriodComparison(req, res));
router.get('/cohorts', (req, res) => analyticsController.getCohortAnalysis(req, res));
router.get('/health', (req, res) => analyticsController.getServiceHealth(req, res));

export default router;