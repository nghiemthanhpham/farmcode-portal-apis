const { statusCode, successMessage, failMessage } = require('~/common/message');
const { iattService } = require("~/service");

async function login(request, reply) {
  try {
    const data = request.body
    const user = await iattService.account.getAccountByEmail(data);
    if (!user) {
      reply.status(statusCode.badRequest).send({ message: failMessage.unvalidAccount });
    }
    if (user.password !== data.password) {
      reply.status(statusCode.badRequest).send({ message: failMessage.unvalidPassword });
    }
    return reply.status(statusCode.success).send({ data: user._id, message: successMessage.index });
  } catch (err) {
    reply.status(statusCode.internalError).send({ message: failMessage.internalError });
  }
}

async function loginWithGoogle(request, reply) {
  try {
    console.log(request.user);
    const data = await iattService.account.getAccountByEmail(request.user?.emails[0]?.value?.toLowerCase());
    if (data) {
      reply.redirect(
        `${process.env.CLIENT_URL}/sso?account_id=${data?._id}`
      );
    }
    else {
      const dataAccount = {
        email: request.user?.emails[0]?.value?.toLowerCase(),
        password: '',
        name: request.user?.displayName,
        status: true,
        role: 'personal',
        avatar: request?.user?.picture,
      };
      const newUser = await iattService.account.createAccount(dataAccount);
      reply.redirect(
        `${process.env.CLIENT_URL}/sso?account_id=${newUser?.insertedId}`
      );
    }
  } catch (error) {
    reply.redirect(`${process.env.CLIENT_URL}/sso?account_id=null`);
  }
}

module.exports = {
  login,
  loginWithGoogle
};