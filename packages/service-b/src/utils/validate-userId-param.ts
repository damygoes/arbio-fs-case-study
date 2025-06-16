import { Request, Response } from 'express';

export function validateUserIdParam(req: Request, res: Response): string | null {
  const { userId } = req.params;
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
    return null;
  }
  return userId;
}
