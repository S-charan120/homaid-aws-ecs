const services = [
  { id: 'cleaning', name: 'Home Cleaning', category: 'Cleaning', description: 'Deep and regular home cleaning', indicativePriceINR: 799 },
  { id: 'plumbing', name: 'Plumbing', category: 'Repairs', description: 'Leak, tap and pipe repairs', indicativePriceINR: 499 },
  { id: 'electrical', name: 'Electrical', category: 'Repairs', description: 'Electrical repairs and installation', indicativePriceINR: 599 },
  { id: 'ac-service', name: 'AC Service', category: 'Appliances', description: 'Inspection and preventive service', indicativePriceINR: 999 }
];
const transitions = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: []
};
function validateBooking(input) {
  const errors = [];
  if (!input || typeof input !== 'object') return ['A JSON booking object is required'];
  if (!services.some(s => s.id === input.serviceId)) errors.push('serviceId is not in the service catalogue');
  if (typeof input.customerName !== 'string' || input.customerName.trim().length < 2 || input.customerName.trim().length > 100) errors.push('customerName must be 2-100 characters');
  if (typeof input.customerEmail !== 'string' || input.customerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customerEmail)) errors.push('customerEmail must be valid');
  if (typeof input.address !== 'string' || input.address.trim().length < 8 || input.address.trim().length > 500) errors.push('address must be 8-500 characters');
  const date = new Date(input.scheduledAt);
  if (!input.scheduledAt || Number.isNaN(date.getTime()) || date.getTime() < Date.now() + 60 * 60 * 1000) errors.push('scheduledAt must be at least one hour in the future');
  if (input.notes !== undefined && (typeof input.notes !== 'string' || input.notes.trim().length > 1000)) errors.push('notes must be at most 1000 characters');
  return errors;
}
function canTransition(from, to) { return Boolean(transitions[from] && transitions[from].includes(to)); }
module.exports = { services, transitions, validateBooking, canTransition };
