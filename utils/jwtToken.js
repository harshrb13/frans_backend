//create token and set to cookie
const sendToken = (user,statusCode,res,tokenName)=>{
    const token = user.getJWTToken();

    //options for cookie
    const options={
        expires:new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly:true 
    }

    res.status(statusCode).cookie(tokenName,token,options).json({
        success:true,
        user,
        token
    })
}

module.exports = sendToken