import { Errback, NextFunction, Request, Response, Router } from "express"

const errorRouter = Router();

errorRouter.use((err: Errback, _req: Request, _res: Response, next: NextFunction) => {
    console.log("Error handler intercepted following error: " + err);
    _res.sendStatus(500);
    return;
});

export default errorRouter;