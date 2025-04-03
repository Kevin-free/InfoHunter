// src/types/firebase.d.ts
declare module 'firebase' {
  // 这里可以添加自定义的类型声明，或引入其他类型
  export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  }
}
