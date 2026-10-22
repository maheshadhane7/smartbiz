#!/bin/bash
# SmartBiz AI - Quick Launcher
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
echo "========================================================"
echo " Starting SmartBiz AI - Smart Billing, ERP & CRM Platform"
echo "========================================================"
(sleep 2 && open "http://localhost:3000") &
npm run dev
