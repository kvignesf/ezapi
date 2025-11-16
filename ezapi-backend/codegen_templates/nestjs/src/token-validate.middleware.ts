import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersRepository } from './users.repository.ts'; // Replace with your token repository

@Injectable()
export class TokenValidationMiddleware implements NestMiddleware {
  constructor(private readonly usersRepository: UsersRepository) {} 

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await this.usersRepository.findOne({ sgid: token });

    if (!user) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  }
}
