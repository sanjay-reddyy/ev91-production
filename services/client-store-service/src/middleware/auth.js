"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTeamAccess = exports.requireRole = exports.authMiddleware = void 0;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var authMiddleware = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, token, decoded;
    return __generator(this, function (_a) {
        try {
            authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({
                    success: false,
                    message: 'Authorization token required'
                });
                return [2 /*return*/];
            }
            token = authHeader.substring(7);
            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET environment variable is not set');
            }
            decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // Attach user info to request
            req.user = {
                id: decoded.id || decoded.userId,
                email: decoded.email,
                role: decoded.role,
                teamId: decoded.teamId
            };
            next();
        }
        catch (error) {
            console.error('Auth middleware error:', error);
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
                return [2 /*return*/];
            }
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                res.status(401).json({
                    success: false,
                    message: 'Token expired'
                });
                return [2 /*return*/];
            }
            res.status(500).json({
                success: false,
                message: 'Authentication error'
            });
        }
        return [2 /*return*/];
    });
}); };
exports.authMiddleware = authMiddleware;
// Role-based authorization middleware
var requireRole = function (allowedRoles) {
    return function (req, res, next) {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
// Team-specific authorization
var requireTeamAccess = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var teamId;
    return __generator(this, function (_a) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return [2 /*return*/];
            }
            // Super admin can access everything
            if (req.user.role === 'super_admin') {
                next();
                return [2 /*return*/];
            }
            teamId = req.params.teamId || req.body.teamId || req.query.teamId;
            if (teamId && req.user.teamId !== teamId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied to this team resource'
                });
                return [2 /*return*/];
            }
            next();
        }
        catch (error) {
            console.error('Team access middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization error'
            });
        }
        return [2 /*return*/];
    });
}); };
exports.requireTeamAccess = requireTeamAccess;
