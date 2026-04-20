'use strict';

const Joi = require('joi');
const { schemas } = require('../../middleware/validate');

/**
 * LeadController — thin handler for lead (contact) endpoints.
 */
class LeadController {
  /** @param {import('./lead.service')} leadService */
  constructor(leadService) {
    this.leadService = leadService;

    this.createLead = this.createLead.bind(this);
  }

  /**
   * POST /api/listings/:id/contact
   * Creates a lead for the listing specified in the route param.
   */
  async createLead(req, res, next) {
    try {
      const ip   = req.ip || req.connection.remoteAddress;
      const lead = await this.leadService.createLead(req.params.id, req.body, ip);
      res.status(201).json({ success: true, data: lead });
    } catch (err) { next(err); }
  }
}

const createLeadSchema = Joi.object({
  name:    Joi.string().max(200),
  phone:   schemas.phone.required(),
  email:   Joi.string().email(),
  message: Joi.string().max(2000),
  source:  Joi.string().max(100).default('web'),
});

module.exports = { LeadController, createLeadSchema };
