const { ieltsvietModel } = require('~/model');
const { ObjectId } = require("mongodb");
const crypto = require('crypto');

async function getAllAccounts() {
  const accounts = await ieltsvietModel.account.find({});
  return accounts
    .filter(account => !account.deleted_at) 
    .map(({ _id, teacher_name, teacher_avatar, role, latest_datetime_check_in, latest_datetime_check_out, latest_status }) => ({
      _id,
      teacher_name,
      teacher_avatar,
      role,
      latest_datetime_check_in,
      latest_datetime_check_out,
      latest_status
    }));
}

async function getAccount(id) {
  const account = await ieltsvietModel.account.findOne({ _id: new ObjectId(id) });
  const user = {
    _id: account._id,
    teacher_name: account.teacher_name,
    teacher_avatar: account.teacher_avatar,
    role: account.role,
    latest_datetime_check_in: account.latest_datetime_check_in,
    latest_datetime_check_out: account.latest_datetime_check_out,
    latest_status: account.latest_status,
  }
  return user;
}

async function updateAccount(id, data) {
  return ieltsvietModel.account.updateOne({ _id: new ObjectId(id) }, data);
}

async function check(id) {
  const account = await ieltsvietModel.account.findOne({ _id: new ObjectId(id) });
  if (account.latest_status === 'checked-in') {
    await ieltsvietModel.account.updateOne({ _id: new ObjectId(id) }, {latest_status: 'need-check-in', latest_datetime_check_out: new Date()});
    const insert_data = {
      account_id: account._id,
      check_in: account.latest_datetime_check_in,
      check_out: new Date(),
      status: 'done'
    }
    await ieltsvietModel.timekeeping.insertOne(insert_data);
    return ({time: new Date(), status: 'done-check-out'});
  }
  else if(account.latest_status === 'need-check-in'){
      await ieltsvietModel.account.updateOne({ _id: new ObjectId(id) }, {latest_status: 'checked-in', latest_datetime_check_in: new Date()});
      return ({time: new Date(), status: 'done-check-in'});
  }
  return ;
}

async function login(id, data) {

  const account = await ieltsvietModel.account.findOne({ _id: new ObjectId(id) });
  if (!account) {
    return null;
  }
  if (account.login_code === data.login_code) {
      if(account.latest_status === 'checked-in') {
        const now = new Date();
        if(now.getDate() != account.latest_datetime_check_in.getDate()) {
          await ieltsvietModel.account.updateOne({ _id: new ObjectId(id) }, {latest_status: 'need-check-in', latest_datetime_check_in: now});
          const insert_data = {
            account_id: account._id,
            check_in: account.latest_datetime_check_in,
            check_out: now,
            status: 'late'
          }
          await ieltsvietModel.timekeeping.insertOne(insert_data);
          const user = {
            _id: account._id,
            teacher_name: account.teacher_name,
            teacher_avatar: account.teacher_avatar,
            role: account.role,
            latest_datetime_check_in: account.latest_datetime_check_in,
            latest_datetime_check_out: now,
            latest_status: account.latest_status,
          }
          return ({user: user, status: 'late'});
        }
      }
      const user = {
        _id: account._id,
        teacher_name: account.teacher_name,
        teacher_avatar: account.teacher_avatar,
        role: account.role,
        latest_datetime_check_in: account.latest_datetime_check_in,
        latest_datetime_check_out: account.latest_datetime_check_out,
        latest_status: account.latest_status,
      }
    return user;
  }
  return null;
}

async function createAccount(data) {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  while (await ieltsvietModel.account.findOne
    ({ login_code: code })) {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  }
  const data_insert = {
    ...data,
    login_code: code,
    latest_datetime_check_in: new Date(),
    latest_datetime_check_out: new Date(),
    latest_status: 'need-check-in',
  };
  return await ieltsvietModel.account.insertOne(data_insert);
}

async function deleteAccount(id) {
  const dataUpdate = {
    deleted_at: new Date(),
  };
  return ieltsvietModel.account.updateOne({ _id: new ObjectId(id) }, dataUpdate);
}

module.exports = {
  getAllAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  login,
  check
};
