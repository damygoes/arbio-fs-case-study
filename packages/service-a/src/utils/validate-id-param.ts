import { Request, Response } from 'express';

export function validateIdParam(req: Request, res: Response): string | null {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
    return null;
  }
  return id;
}
