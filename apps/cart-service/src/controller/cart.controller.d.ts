import { Response } from "express";
import { AuthedRequest } from "../middleware/requireAuth";
export declare const getCart: (req: AuthedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const saveCart: (req: AuthedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const clearCart: (req: AuthedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=cart.controller.d.ts.map