import { Request, Response, NextFunction } from "express";
export interface AuthedRequest extends Request {
    userId?: string;
}
export declare const requireAuth: (req: AuthedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=requireAuth.d.ts.map