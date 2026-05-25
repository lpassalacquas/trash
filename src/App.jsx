import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PRICE_PER_BAG = 1.00;
const ZELLE = { name: "Zelle", handle: "3058770025" };
const CASHAPP = { name: "Cash App", handle: "$05LPS" };
const VENMO = { name: "Venmo", handle: "@Luca-Passalacqua" };
const ADMIN_PIN = "2005";

const STATUS_COLORS = {
  pending: { bg: "#FEF3C7", text: "#92400E", label: "Pending" },
  scheduled: { bg: "#DBEAFE", text: "#1E40AF", label: "Scheduled" },
  complete: { bg: "#D1FAE5", text: "#065F46", label: "Complete" },
  paid: { bg: "#FFEDD5", text: "#9A3412", label: "Paid" },
};

function generateId() {
  return "JOB-" + Math.random().toString(36).substr(2, 6).toUpperCase();
}

const fonts = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');`;

const styles = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Syne', sans-serif; background: #0C0C0C; color: #F0EDE8; min-height: 100vh; }
.nav { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid #1E1E1E; }
.nav-logo { font-size: 13px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #FF8C00; font-family: 'DM Mono', monospace; }
.nav-tabs { display: flex; gap: 4px; background: #161616; border-radius: 8px; padding: 3px; }
.nav-tab { padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer; font-size: 12px; font-weight: 600; font-family: 'Syne', sans-serif; letter-spacing: 0.05em; transition: all 0.15s; background: transparent; color: #666; }
.nav-tab.active { background: #FF8C00; color: #0C0C0C; }
.form-page { max-width: 500px; margin: 0 auto; padding: 2.5rem 1.5rem; }
.form-hero { margin-bottom: 2.5rem; }
.form-hero h1 { font-size: 2rem; font-weight: 800; line-height: 1.1; margin-bottom: 0.5rem; }
.form-hero h1 span { color: #FF8C00; }
.form-hero p { font-size: 13px; color: #888; line-height: 1.6; font-family: 'DM Mono', monospace; }
.form-card { background: #141414; border: 1px solid #222; border-radius: 16px; padding: 1.75rem; }
.form-section-label { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #555; font-family: 'DM Mono', monospace; margin-bottom: 1rem; }
.form-group { margin-bottom: 1rem; }
.form-label { display: block; font-size: 12px; color: #999; margin-bottom: 5px; font-family: 'DM Mono', monospace; }
.form-input { width: 100%; background: #0C0C0C; border: 1px solid #2A2A2A; border-radius: 8px; padding: 10px 12px; color: #F0EDE8; font-size: 14px; font-family: 'Syne', sans-serif; outline: none; transition: border-color 0.15s; }
.form-input:focus { border-color: #FF8C00; }
.form-input::placeholder { color: #444; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.card-block { background: #0C0C0C; border: 1px solid #2A2A2A; border-radius: 8px; padding: 12px; margin-bottom: 1rem; }
.price-preview { background: #0C0C0C; border-radius: 8px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border: 1px solid #1E1E1E; }
.price-label { font-size: 12px; color: #666; font-family: 'DM Mono', monospace; }
.price-amount { font-size: 18px; font-weight: 700; color: #FF8C00; font-family: 'DM Mono', monospace; }
.submit-btn { width: 100%; padding: 13px; background: #FF8C00; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; color: #0C0C0C; font-family: 'Syne', sans-serif; cursor: pointer; letter-spacing: 0.05em; transition: all 0.15s; }
.submit-btn:hover { background: #FFA533; transform: translateY(-1px); }
.submit-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.success-page { max-width: 460px; margin: 4rem auto; padding: 0 1.5rem; text-align: center; }
.success-icon { font-size: 3rem; margin-bottom: 1rem; }
.success-page h2 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; }
.success-page p { color: #888; font-family: 'DM Mono', monospace; font-size: 13px; line-height: 1.6; }
.job-id { display: inline-block; background: #141414; border: 1px solid #FF8C00; color: #FF8C00; font-family: 'DM Mono', monospace; font-size: 13px; padding: 6px 14px; border-radius: 6px; margin: 1.25rem 0; }
.back-btn { background: transparent; border: 1px solid #333; color: #888; padding: 10px 20px; border-radius: 8px; font-family: 'Syne', sans-serif; font-size: 13px; cursor: pointer; margin-top: 1rem; }
.admin-page { padding: 1.5rem; }
.admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.admin-title { font-size: 1.25rem; font-weight: 800; }
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 1.5rem; }
.stat-card { background: #141414; border: 1px solid #1E1E1E; border-radius: 12px; padding: 1rem; }
.stat-val { font-size: 1.5rem; font-weight: 800; color: #FF8C00; font-family: 'DM Mono', monospace; }
.stat-label { font-size: 11px; color: #555; font-family: 'DM Mono', monospace; margin-top: 2px; }
.add-job-btn { background: #FF8C00; border: none; border-radius: 8px; color: #0C0C0C; font-size: 12px; font-weight: 700; font-family: 'Syne', sans-serif; padding: 8px 16px; cursor: pointer; letter-spacing: 0.05em; }
.jobs-list { display: flex; flex-direction: column; gap: 10px; }
.job-card { background: #141414; border: 1px solid #1E1E1E; border-radius: 12px; padding: 1.25rem; }
.job-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
.job-name { font-size: 15px; font-weight: 700; }
.job-addr { font-size: 12px; color: #666; font-family: 'DM Mono', monospace; margin-top: 2px; }
.status-badge { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; }
.job-meta { display: flex; gap: 16px; margin-top: 10px; flex-wrap: wrap; }
.job-meta-item { font-size: 11px; font-family: 'DM Mono', monospace; color: #666; }
.job-meta-item span { color: #F0EDE8; font-weight: 500; }
.job-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.action-btn { font-size: 12px; font-weight: 600; font-family: 'Syne', sans-serif; padding: 7px 14px; border-radius: 7px; cursor: pointer; border: 1px solid #2A2A2A; background: #0C0C0C; color: #F0EDE8; transition: all 0.15s; }
.action-btn.primary { background: #FF8C00; border-color: #FF8C00; color: #0C0C0C; }
.action-btn.danger { border-color: #7F1D1D; color: #FCA5A5; }
.action-btn.zelle { border-color: #6D28D9; color: #C4B5FD; }
.photos-row { display: flex; gap: 8px; margin-top: 10px; }
.photo-thumb { width: 60px; height: 60px; border-radius: 6px; object-fit: cover; border: 1px solid #2A2A2A; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal { background: #141414; border: 1px solid #2A2A2A; border-radius: 16px; padding: 1.75rem; width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto; }
.modal h3 { font-size: 1.1rem; font-weight: 800; margin-bottom: 1.25rem; }
.modal-actions { display: flex; gap: 8px; margin-top:
