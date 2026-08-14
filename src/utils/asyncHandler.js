//this asynchandler is using promises
const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next))
         .catch( (err) => next(err) )
    }
}


export {asyncHandler}

// const asyncHandler = (fn) => async (req,res,next) => { //ek function argument mein liya and usko further ek aur function mein pass kardiya
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success : false,
//             message: error.message
//         })
//     }
// }
//this asynchandler is using try catch block