import { Router } from 'express';
import { UserRepository } from '../users/user.repository';
import { OrderController } from './order.controller';
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';

const router = Router();

const orderRepository = new OrderRepository();
const userRepository = new UserRepository();
const orderService = new OrderService(orderRepository, userRepository);
const orderController = new OrderController(orderService);

// Order CRUD operations
router.get('/', (req, res) => orderController.getOrders(req, res));
router.get('/stats', (req, res) => orderController.getOrderStats(req, res));
router.get('/:id', (req, res) => orderController.getOrder(req, res));
router.post('/', (req, res) => orderController.createOrder(req, res));
router.put('/:id', (req, res) => orderController.updateOrder(req, res));
router.delete('/:id', (req, res) => orderController.deleteOrder(req, res));

// Status management
router.patch('/:id/status', (req, res) => orderController.updateOrderStatus(req, res));
router.patch('/:id/cancel', (req, res) => orderController.cancelOrder(req, res));

// User-specific orders
router.get('/user/:userId', (req, res) => orderController.getUserOrders(req, res));
router.get('/user/:userId/stats', (req, res) => orderController.getUserOrderStats(req, res));

export default router;