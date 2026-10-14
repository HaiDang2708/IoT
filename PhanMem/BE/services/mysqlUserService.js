const db = require('../config/mysql');
const bcrypt = require('bcryptjs');

const USER_FIELDS = 'id, ten_dang_nhap, ho_ten, email, ngay_sinh, so_dien_thoai, github, drive, api_doc, figma, avatar, mssv, lop_hanh_chinh, khoa, giang_vien_huong_dan, mui_gio, gioi_tinh, dia_chi';

// Helper định dạng ngày local tránh lệch múi giờ (Timezone offset)
function formatLocalDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Lấy thông tin hồ sơ người dùng
async function getUserProfile(username) {
  try {
    const [rows] = await db.query(
      `SELECT ${USER_FIELDS} FROM users WHERE ten_dang_nhap = ?`,
      [username]
    );

    if (rows.length === 0) return null;
    const data = rows[0];

    return {
      username: data.ten_dang_nhap,
      fullName: data.ho_ten,
      email: data.email,
      birthday: formatLocalDate(data.ngay_sinh),
      phone: data.so_dien_thoai || '',
      github: data.github || '',
      drive: data.drive || '',
      apiDoc: data.api_doc || '',
      figma: data.figma || '',
      avatar: data.avatar || '',
      mssv: data.mssv || '',
      lopHanhChinh: data.lop_hanh_chinh || '',
      khoa: data.khoa || '',
      giangVienHuongDan: data.giang_vien_huong_dan || '',
      muiGio: data.mui_gio || '',
      gioiTinh: data.gioi_tinh || '',
      diaChi: data.dia_chi || '',
    };
  } catch (err) {
    console.error('[MySQL-Service Error] getUserProfile failed:', err.message);
    return null;
  }
}

// Cập nhật thông tin hồ sơ
async function updateUserProfile(username, profile) {
  try {
    const birthday = profile.birthday ? profile.birthday : null;
    const [result] = await db.query(
      `UPDATE users 
       SET ho_ten = ?, email = ?, ngay_sinh = ?, so_dien_thoai = ?, github = ?, drive = ?, api_doc = ?, figma = ?, avatar = ?, 
           mssv = ?, lop_hanh_chinh = ?, khoa = ?, giang_vien_huong_dan = ?, mui_gio = ?, gioi_tinh = ?, dia_chi = ?
       WHERE ten_dang_nhap = ?`,
      [
        profile.fullName,
        profile.email,
        birthday,
        profile.phone || null,
        profile.github || null,
        profile.drive || null,
        profile.apiDoc || null,
        profile.figma || null,
        profile.avatar || null,
        profile.mssv || null,
        profile.lopHanhChinh || null,
        profile.khoa || null,
        profile.giangVienHuongDan || null,
        profile.muiGio || null,
        profile.gioiTinh || null,
        profile.diaChi || null,
        username
      ]
    );
    return result.affectedRows > 0;
  } catch (err) {
    console.error('[MySQL-Service Error] updateUserProfile failed:', err.message);
    return false;
  }
}

// Xác thực đăng nhập bằng BCrypt trên Backend
async function verifyUserLogin(username, password) {
  try {
    const [rows] = await db.query(
      `SELECT ${USER_FIELDS}, mat_khau FROM users WHERE ten_dang_nhap = ?`,
      [username]
    );

    if (rows.length === 0) {
      console.log('[MySQL-Auth] Khong tim thay user:', username);
      return null;
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.mat_khau);

    if (!isMatch) {
      console.log('[MySQL-Auth] Sai mat khau cho user:', username);
      return null;
    }

    // Trả về thông tin user không kèm password hash
    return {
      id: user.id,
      ten_dang_nhap: user.ten_dang_nhap,
      ho_ten: user.ho_ten,
      email: user.email,
      ngay_sinh: formatLocalDate(user.ngay_sinh),
      so_dien_thoai: user.so_dien_thoai,
      github: user.github,
      drive: user.drive,
      apiDoc: user.api_doc || '',
      figma: user.figma || '',
      avatar: user.avatar,
      mssv: user.mssv || '',
      lopHanhChinh: user.lop_hanh_chinh || '',
      khoa: user.khoa || '',
      giangVienHuongDan: user.giang_vien_huong_dan || '',
      muiGio: user.mui_gio || '',
      gioiTinh: user.gioi_tinh || '',
      diaChi: user.dia_chi || ''
    };
  } catch (err) {
    console.error('[MySQL-Service Error] verifyUserLogin failed:', err.message);
    return null;
  }
}

// Cập nhật mật khẩu an toàn
async function updateUserPassword(username, oldPass, newPass) {
  try {
    const [rows] = await db.query('SELECT mat_khau FROM users WHERE ten_dang_nhap = ?', [username]);
    if (rows.length === 0) return false;

    const user = rows[0];
    const isMatch = await bcrypt.compare(oldPass, user.mat_khau);

    if (!isMatch) {
      console.log('[MySQL-Auth] Doi mat khau that bai: Sai mat khau cu');
      return false;
    }

    // Băm mật khẩu mới (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(newPass, salt);

    const [result] = await db.query('UPDATE users SET mat_khau = ? WHERE ten_dang_nhap = ?', [hashPass, username]);
    return result.affectedRows > 0;
  } catch (err) {
    console.error('[MySQL-Service Error] updateUserPassword failed:', err.message);
    return false;
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  verifyUserLogin,
  updateUserPassword
};
