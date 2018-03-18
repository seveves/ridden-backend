function isVendor(req, res, next) {
  if (!req.jwtData || !req.jwtData.roles || (req.jwtData.roles.indexOf('vendor') === -1 && req.jwtData.roles.indexOf('admin') === -1)) {
    res.status(403).send({ error: { name: 'MissingRoles', message: 'No access to this route with current roles.' }});
    return;
  }
  next();
}

function isAdmin(req, res, next) {
  if (!req.jwtData || !req.jwtData.roles || req.jwtData.roles.indexOf('admin') === -1) {
    res.status(403).send({ error: { name: 'MissingRoles', message: 'No access to this route with current roles.' }});
    return;
  }
  next();
}

module.exports = { isVendor, isAdmin };
