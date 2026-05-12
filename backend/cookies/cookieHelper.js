const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};  

exports.setCookie = (res, name, value, options = {}) => {
  res.cookie(name, value, { ...cookieOptions, ...options });
};

exports.clearCookie = (res, name) => {
  res.clearCookie(name, { ...cookieOptions, maxAge: 0 });
};
