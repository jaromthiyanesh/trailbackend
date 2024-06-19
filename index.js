const { PrismaClient } = require("@prisma/client")
const express = require("express")
const app = express()
app.use(express.json())
const prisma = new PrismaClient()
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var cors = require('cors')
app.use(cors())

app.post("/register", async (req,res)=>{
    const userdata = req.body;

    const existinguser = await prisma.user.findUnique({
        where:{
            email:userdata.email
        }
    })

    if(existinguser===null){
       const hashedpassword = await bcrypt.hash(userdata.password, 10)
       
        const newuser = await prisma.user.create({
            data:{
                name:userdata.name,
                email:userdata.email,
                phonenumber:userdata.phonenumber,
                password:hashedpassword
            }
        })
        res.json({
            message:"Successfully Registered",
            data:newuser
        })

    }else{
        res.json({
            message:"User Already Registered"
        })
    }

   
})

app.post("/login", async (req,res)=>{
    const userdata = req.body
    const existinguser = await prisma.user.findUnique({
        where:{
            email:userdata.email
        }
    })
    if (existinguser===null){
        res.json({
            message:"User Not Found Register for an account"
        })
    }else{

       const user = bcrypt.compare(userdata.password, existinguser.password)

           if (user) {
            const {password,...userdata}=existinguser
            var accesstoken = jwt.sign({ user_id: existinguser.user_id }, 'jarom',{
                expiresIn:"60s"
            });
            var refreshtoken = jwt.sign({ user_id: existinguser.user_id }, 'jarom',{
                expiresIn:"1d"
            });

            await prisma.token.create({
                data:{
                    user_id:existinguser.user_id,
                    refreshtoken:refreshtoken
                }
            })

               res.json({ message: "You have successfully logged in",
                data:userdata,
                token:{
                    accesstoken,
                    refreshtoken
                }
                })
           } else {
               res.json({ message: "Invalid user" })
           }

       };
        
    
})

app.post("/refresh", async(req,res)=>{
    const userdata = req.body
    const tokenvalid = await prisma.token.findFirst({
        where:{
            refreshtoken:userdata.refreshtoken
        }
    })
    if(tokenvalid===null){
            res.json({
                message:"token is not valid"
            })
    }else{
        jwt.sign({ tokenvalid: tokenvalid.refreshtoken }, "jarom", function(err) {
            if(err === null){
                 const accesstoken =  jwt.sign({ user_id: tokenvalid.user_id }, 'jarom',{
                    expiresIn:"60s"
                });
                res.json({
                    accesstoken
                })
            }else{
                res.json({
                    message:"token invalid"
                })
            }
          });
    }

})

app.listen(7000)