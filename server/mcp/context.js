export function createContext(req){

    return {

        user:{

            id:req.user.id,

            email:req.user.email,

            role:req.user.role

        },

        ip:req.ip,

        requestId:crypto.randomUUID(),

        timestamp:Date.now()

    };

}