<template>
  <div class="login w-full h-screen">
    <div class="login-title-box">
      <div class="text-white text-3xl text-center mt-12 tracking-wider login-title">深圳市联合应急指挥系统</div>
    </div>
    <!-- bg-white -->
    <div class="loginFrame w-3/12 p-10 rounded-lg bg-opacity-90 m-auto mt-52">
      <!-- <el-tabs v-model="activeName">
        <el-tab-pane class="tabHarf" label="账号登录" name="first"> -->
      <h3 class="text-center text-white text-2xl font-bold mb-5">登录/Login</h3>
      <form class="ml-20 mr-20">
        <div class="input-group addMarginBottom_15 addMarginTop_15">
          <el-input v-model="form.username" type="text" class="form-control" placeholder="请输入账号" />
        </div>
        <div class="my-2">
          <el-input id="btn" v-model="form.password" type="password" class="form-control password" placeholder="请输入密码" />
        </div>
        <div class="loginCodeLine mb-4 flex">
          <el-input v-model="form.code" auto-complete="off" placeholder="验证码" style="width: 72%" class="mr-2"> </el-input>

          <div class="login-code">
            <img :src="codeUrl" class="h-10" @click="getCode" />
          </div>
        </div>
        <div class="row">
          <el-col :span="24" class="addMarginBottom_15 addMarginTop_15 login-btn">
            <el-button class="btn-block" type="primary" :disabled="!isLogin" :loading="loading" @click="loginSubmit">登录</el-button>
          </el-col>
        </div>
      </form>
      <!-- 一张图 -->
      <!-- <el-popover placement="top" :width="200" :disabled="onePicForm.disabled" trigger="click">
        <el-input v-model="onePicForm.code" style="width: 60px; height: 40px; float: left"></el-input>
        <img :src="onePicForm.codeUrl" class="h-10" @click="getCodeOnePic" />
        <el-button @click="onePicLogin" style="width: 100%; maring-top: 5px">登录</el-button>
        <template #reference>
          <p @click="getCodeOnePic" style="color: #fff; clear: both; text-align: center">登录一张图</p>
        </template>
      </el-popover> -->
      <!-- </el-tab-pane>
      </el-tabs> -->
    </div>
  </div>
</template>
<script lang="ts" setup>
// 公钥通常用于加密会话密钥、验证数字签名，或加密可以用相应的私钥解密的数据
import { get, post } from '@/utils/fetch/fetch';

// const baseUrl = process.env.NODE_ENV === 'development' ? '' : ''
import CryptoJS from 'crypto-js';
// import { ElMessage } from 'element-plus'
import { useStorage } from 'vue3-storage';
const router = useRouter();
const route = useRoute();
const storage = useStorage();
const codeUrl = ref('');
const form = reactive({
  username: '',
  password: '',
  code: '',
  uuid: '',
});
let loading = ref(false);
const isLogin = () => {
  if (form.username && form.password) return true;
  else return false;
};

const getCode = async () => {
  const res = await get('/code');
  codeUrl.value = 'data:image/gif;base64,' + res.img;
  form.uuid = res.uuid;
};

const loginSuccess = () => {
  const returnUrl = route.query.returnUrl;
  router.replace(returnUrl ? decodeURIComponent(returnUrl) : '/');
};

const num1 = () => {
  var mm = Math.random();
  let six;
  if (mm > 0.1) {
    six = Math.round(mm * 1000000);
  } else {
    mm += 0.1;
    six = Math.round(mm * 1000000);
  }
  return six;
};

const loginSubmit = () => {
  if (form.username === '' || form.password === '') {
    return;
  }
  loading.value = true;
  let setPassword = encodeAesString(form.password);
  const params = {
    username: form.username,
    password: setPassword,
    code: form.code,
    uuid: form.uuid,
  };

  post('/system/tymh/login', params)
    .then((res) => {
      let { code, token, user } = res;
      // if (code == 200 && token && user.userName && user.roles.length && user.roles[0].roleName) {
      if (code == 200 && token) {
        storage.setStorageSync('token', res);
        const returnUrl = route.query.returnUrl;
        // ElMessage({
        //   message: '登录成功',
        //   type: 'success',
        // });
        let url = returnUrl;
        if (decodeURIComponent(returnUrl).includes('returnUrl=')) {
          url = decodeURIComponent(returnUrl).split('returnUrl=').pop() || '/';
        }
        window.location.href = `${window.location.pathname}#${url}`;
      } else {
        getCode();
        return false;
      }
    })
    ['catch'](() => {
      getCode();
    })
    .finally(() => {
      loading.value = false;
    });
};

const encodeAesString = (data) => {
  let num = num1();
  var key = CryptoJS.enc.Utf8.parse('yjzhJMTTksjf2021');
  var iv = CryptoJS.enc.Utf8.parse('yjzhMMKDksjf2021');
  var encrypted = CryptoJS.AES.encrypt(num + data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();

  return encrypted;
};
// ===================== 一张图
const onePicForm = ref({ disabled: false });
async function getCodeOnePic() {
  const res = await get('/onePic/captchaImage', {}, { unwanted: 1 });
  onePicForm.value.codeUrl = 'data:image/gif;base64,' + res.img;
  onePicForm.value.uuid = res.uuid;
}
async function onePicLogin() {
  let setPassword = encodeAesString('changeMe,2020');
  const params = {
    username: 'yszh01',
    password: setPassword,
    code: onePicForm.value.code,
    uuid: onePicForm.value.uuid,
  };

  const { code, token, msg } = await post('/onePic/tymh/login', params, { unwanted: 1 });
  if (code == 200) storage.setStorageSync('onePicToken', token), (onePicForm.value.disabled = true);
  // else ElMessage.error(msg);
}
// ==========================
onMounted(() => {
  getCode();
});

// tokenInfo: '',
// userInfo: {},
// isAdmin: false,
// loginBG,
// // 公钥
// PublicKey:
//   'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCMfmDnpg2FST6V4ZCSlDpWVDBC8LnJ49YJKhWaFVL97G+0t7wPZdmEVc9ufznJbdvRt3hhFJ7Nh46WhhDZFcyL2bC9ya+wGSqbOkO8xSN9Fx0LMRl2UidiYZuLFkDlfJ06WxSYmEOagihKgj9cx4CdLaM5e8PCdbP9rduV8OcJ2wIDAQAB',
// // 私钥
// PrivateKey:
//   'MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAIx+YOemDYVJPpXhkJKUOlZUMELwucnj1gkqFZoVUv3sb7S3vA9l2YRVz25/Oclt29G3eGEUns2HjpaGENkVzIvZsL3Jr7AZKps6Q7zFI30XHQsxGXZSJ2Jhm4sWQOV8nTpbFJiYQ5qCKEqCP1zHgJ0tozl7w8J1s/2t25Xw5wnbAgMBAAECgYAZI7gVW2pJ8lxHl5A2Gl4B+piUMd0c2i7/fs9UvgIWu8sVTFdTbgcpHe27OPrPJ2BRO4JH5NexsVL7bkvvfG4YSGDtIwSrwT/YClNASN5T27+WWEcYjN7viKMyYpmywlRgO1s3ofFURD1GOfj7sMVUhnNlhpRKkgCyUNP9yYnBIQJBAL+L6MPRojkfyfVY0TTpYXBytihtc7MfNFrQw7nWpfcAREUEro2PsQvSsykipcBEwknfTdL5T/zjNydNnYgxlbECQQC7xLQaw0utcvvVfbw2Kj5b6OqozpIh05UjhrZht8fDGu4D0wfbqPh4BnggN/zpTfIT8hz+3s+t8Z9lFSDIa99LAkB4OGrORIvJyK7sI2OjDvuOJSE5PIEKooIsoazGvfcKkQtIOkkIJnCbmBHEtq9Lfpxm2xWwXbQbZ8ydCXTfHyfxAkAzrt4AK9dNw8OLrRM8OX52n/LPSiSxCOMZJ0BWP1bN3kC7br/P93+E0gsIm0CTGzBRyyeuA7hYYZSFJz6hzAdnAkEAm6jyMsZvv+YgD6bYQqRcj5qfQRfQLdwfnMXlCmJ3WbuXvLPr8pledfrKt40xd7Bt+veAYM7F2IUlGBN1X3ayTg==',

// activeName: 'first',
// rules: {
//   username: [
//     { required: true, message: '请输入用户名', trigger: 'blur' },
//   ],
//   password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
// }
</script>
<style lang="scss">
.login {
  margin: 0;
  padding: 0;
  background-color: #1a70e5;
  // background-size: 100%;
  background-size: cover;
  background-repeat: no-repeat;
  overflow: hidden;
  position: relative;
  background-image: url('@/assets/images/LoginBG.png');
  .login-title-box {
    // background: url(@/assets/img/headline.png) no-repeat center top;
    height: 123px;
    line-height: 123px;
    display: flex;
    align-items: center;
    justify-items: center;
    .login-title {
      width: 820px;
      text-align: center;
      font-size: 36px;
      font-weight: bold;
      color: #ffffff;
      letter-spacing: 2px;
      background: linear-gradient(360deg, #0088ff 0%, #ffffff 100%);
      margin: 0 auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
  .loginFrame {
    width: 640px;
    box-shadow: inset 0 0 40px #4397dd;
    overflow: hidden;
    border-radius: 0;
    border: 2px solid;
    border-image: linear-gradient(149deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 1)) 1;
    .el-input__inner {
      border-radius: 0;
      background-color: transparent !important;
      color: #fff;
      border-color: #3277b1;
    }
    input:-webkit-autofill,
    textarea:-webkit-autofill,
    select:-webkit-autofill {
      -webkit-box-shadow: 0 0 0 400px #0a3257 inset;
      -webkit-text-fill-color: #fff; //设置字体颜色
    }
    .login-btn {
      width: 100%;
      border: 1px solid;
      padding: 5px 8px;
      border-image: linear-gradient(94deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0) 80%, rgba(255, 255, 255, 1)) 1 1;
      .el-button {
        background: linear-gradient(95deg, #64c2ff 0%, #348fff 100%);
        width: 100%;
        border-radius: 0;
      }
    }
  }
}
.icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
}
</style>
