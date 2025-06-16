import { Router } from 'express';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

const router = Router();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// User CRUD operations
router.get('/', (req, res) => userController.getUsers(req, res));
router.get('/stats', (req, res) => userController.getUserStats(req, res));
router.get('/:id', (req, res) => userController.getUser(req, res));
router.get('/:id/with-orders', (req, res) => userController.getUserWithOrders(req, res));
router.post('/', (req, res) => userController.createUser(req, res));
router.put('/:id', (req, res) => userController.updateUser(req, res));
router.patch('/:id/deactivate', (req, res) => userController.deactivateUser(req, res));
router.delete('/:id', (req, res) => userController.deleteUser(req, res));

export default router;