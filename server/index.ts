import express, { Request, Response } from 'express';

const app = express();

app.get("/", (req: Request, res: Response) => {
    res.send( "Hello world!" );
});

app.listen(8080, () => {
    console.log(`server started at http://localhost:${8080}`);
});