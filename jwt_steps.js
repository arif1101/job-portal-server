/**
 * -------------------
 *          JWT
 * ------------------------
 * 
 * install jsonwebtoken cookie-parser
 * set cookieParser as middleware
 * 
 * 1. create a token
 * 
 * jwt.sign(data, secret, {expiresIn: '5h'})
 * 
 * set token to the cookie of res.cookie('token', token, {
 *      httpOnly: true,
 *      secure: false
 * }).send({})
 * 
 * cors({
 *  origin: [''],
 *   credentials: true
 * })
 * 
 * client: {
 *  withCredentials: true
 * }
 * 
 * 2. send the token to the client side. make sure token is in the cookies (application)
 * 
 * in the cliend side: 
 *  use axios get, post, delete, patch for secure apis and must use : {withCredentials:true}
 * 
 * 4. validate the token in the server side : 
 * if valid : provide data
 * if not valid : logout
 * 
 * 
*/