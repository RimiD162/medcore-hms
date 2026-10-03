const documentService = require('../services/documentService');
const ApiResponse = require('../utils/ApiResponse');

class DocumentController {
  async getDocuments(req, res, next) {
    try {
      const data = await documentService.getDocuments(req.user.doctorId, req.query);
      return ApiResponse.success(res, data, 'Documents retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getDocumentById(req, res, next) {
    try {
      const doc = await documentService.getDocumentById(req.user.doctorId, req.params.id);
      return ApiResponse.success(res, doc, 'Document details retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DocumentController();
