import * as functions from "firebase-functions";
import { db } from "./Firebase/firebase";
import { connect } from "./SQL/Connect";
import { Register } from "./interfaces/Register";
import * as corsModule from 'cors';
import { Login } from "./interfaces/login";
import { Userstake } from "./interfaces/Userstake";
import { Section } from "./interfaces/Section";
import { firestore } from "firebase-admin";
const bcrypt  = require("bcrypt")
const cors = corsModule(({ origin: true }))






//Start of dimeio functions
export const auth = functions.https.onRequest(async (request, response) => {
    
    cors(request, response, async () => { 
    let data = 'Error occured while creating account';
    try{
    const newUser: Register = request.body;
    const payments: Section = {current_balance:0,previous_balance:0,Last_funded_timestamp:newUser.timestamp, uuid:newUser.uuid, email:newUser.email};
   
    const con = await connect();
    const [x] = await  con.query('insert into Newmembers set ?',[newUser]);
    const json: any = x;

      if(json.affectedRows !== 0)
             data="Account Activated";

        if(data ===  "Account Activated"){
            const [reg] = await con.query("insert into  Members_Digit set  ?", [payments])
            const json: any = reg;
    
            if(json.affectedRows !== 0)
                 data="Account Created";

        }

    return response.json({
        message: data
    });
    }catch(err){
        let msg = (err as Error).message;
          if(msg.includes("Duplicate entry"))
                data="Try again account already taken ! "
        return response.json({
            message: data
        });
    }

       
    })
});



export const dimeio = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const data: Userstake = request.body
        let callrespones="Stake could'nt be placed !";
        const conn =  await connect();
        const [isvalid] = await  conn.query("select current_balance from  Members_Digit where uuid = ?",[data.useruuid]);
        let m: any = isvalid;

        getStakeData(m,data,conn,response,callrespones)
        .then(e=>{
            return response.json({
                message: e.data
            });
          }).catch(err => console.log(err));           
       })
});



async function getStakeData(m: any, data: any, conn:any, response:any, callrespones: any) {
   
    if(m.length > 0){
                m.map(async (e: any)=>{
                if(data.amount < e.current_balance){
                        try{
                            const [reg]  = await conn.query("insert into User_stake set ? ",[data]);
                            let y: any = reg;
                            if(y.affectedRows != 0){

                                return await response.json({
                                    message: "Stake  online."
                                });
                              }
                            }catch(err){
                                callrespones = (err as Error).message;
                                if(callrespones.includes("Duplicate entry")){

                                    return await response.json({
                                        message: "Network error time out Pls try again !"
                                    });
                                }
                            }
                    }else{
                        callrespones = "Stake could not be Placed insufficient funds !" 
                        return await response.json({
                            message: callrespones
                        });
                     }
            })
              }else
                    return await response.json({
                        message: "account not found ! "
                    });

  }




export const loginuser = functions.https.onRequest(async (request, response) => {

    cors(request, response, async ()=> {
        const login:  Login = request.body; 
        const con =  await connect();
        const [responed] =  await con.query("Select * from Newmembers where email = ? ",[login.email])
        let y: any = responed;
        getData(y, login.password, response)
                .then(res =>{
                     return response.json({
                        message: res.data
                        });
                    })
                .catch(err => console.log(err));         
        })
    
});



async function getData(y: any, password: string, respones:any) {
    if(y.length > 0 ){
        y.map(async (p: any) => {
         const result = await  bcrypt.compare(password,p.password);
            if(result)
                return await  respones.json({
                    message: y
                });    
            else
            return  await respones.json({
                message: "1"
            });  
          })
       } else
            return await  respones.json({
                message: "0"
            });
  }

//End of dimeio functions





//Start of monclaris functions
type  RegisterUsers = {

    User:{
        name:string,
        phone:number,
        email:string,
        password:string,
        doc_id:string,
    },

}


export const RegisterUser = functions.https.onRequest(async  (request,response) => {

    cors(request,response, async () => {

        try{
            let e: RegisterUsers = request.body

            let f = db.collection("MonclarisRegister").doc();
            e.User.doc_id = f.id;
            f.set(e)

                response.json({
                    message : "New User Registered"
                })

            }catch(err){

                response.json({
                    message: err as Error
                })
            }
    })
})





//Start of all webfly contact function




type  UserConnect = {
    User:{
        doc_id:string,
        name:string,
        emailPhone:string,
        message:string
        stamp: any
    }
}

export const CONNECT_WITH_WEBFLY = functions.https.onRequest(async (req,res) => {


    cors(req,res, async () => {

        try{
                let e: UserConnect = req.body
                
                let connect = db.collection("WEBFLYCONNECT").doc();
                e.User.doc_id = connect.id;
                e.User.stamp = firestore.Timestamp.now();
                connect.set(e);

                return res.json({
                    message:"Thanks Message Received we would keep in touch"
                })
            }catch(err){
                return res.json({
                    message:"Snap Error occurred ! " + err as unknown as Error
                })
            }
    })
})





export const GET_CONTACT_WEBFLY = functions.https.onRequest(async (req,res) => {
    cors(req,res, async () => {
        try{
                let e: UserConnect []  = []
                let connect = await db.collection("WEBFLYCONNECT").get();
                connect.forEach((doc:any) => e.push(doc.data()))
                return res.json({
                    message:e
                })
            }catch(err){
                return res.json({
                    message:"Snap Error occurred ! " + err as unknown as Error
                })
            }
    })
})
