import { createPool } from "mysql2/promise";
import * as dotenv from 'dotenv';
dotenv.config();

export async function connect(){
 const con = await  createPool({
        host : process.env.REACT_APP_HOST,
        user: process.env.REACT_APP_USER,
        password : process.env.REACT_APP_PASSWORD,
        database : process.env.REACT_APP_DB,
        connectionLimit: 20,
        port: 3306
    });
    return con;
}