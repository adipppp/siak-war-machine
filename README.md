# siak-war-machine
Sebuah program yang dapat digunakan untuk melakukan login, navigasi ke page Isi/Ubah IRS, dan logout pada SIAK-NG melalui CLI.

## Prerequisites
Sebelum menjalankan program untuk pertama kalinya, buka Terminal / Command Prompt dan ikuti langkah-langkah berikut:

1. Jalankan `npm install` di root directory ini

2. Buat file baru bernama `.env`, kemudian isi dengan format berikut:

    ```dotenv
    PATH_TO_CHROME_EXE=<path executable chrome/chromium>
    USERNAME_SSO=<username sso>
    PASSWORD_SSO=<password sso>
    ```

3. Selesai

## Menjalankan Program
Cukup jalankan `npm run start` di root directory ini.