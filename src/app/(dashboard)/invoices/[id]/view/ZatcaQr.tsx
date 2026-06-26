"use client";
import { QRCodeSVG } from "qrcode.react";
import { buildZatcaQr } from "@/lib/zatca";

interface Props {
  sellerName: string;
  vatNumber: string;
  invoiceDate: string;
  grandTotal: number;
  vatAmount: number;
  isAr: boolean;
}

export default function ZatcaQr({ sellerName, vatNumber, invoiceDate, grandTotal, vatAmount, isAr }: Props) {
  const qrValue = buildZatcaQr(sellerName, vatNumber, invoiceDate, grandTotal, vatAmount);
  return (
    <div className="border-t border-gray-100 pt-6 mt-6 flex items-start gap-6">
      <div>
        <QRCodeSVG value={qrValue} size={100} level="M" />
      </div>
      <div className="text-xs text-gray-400 leading-relaxed">
        <p className="font-semibold text-gray-500 mb-1">
          {isAr ? "رمز QR الضريبي (ZATCA)" : "ZATCA Tax QR Code"}
        </p>
        <p>{isAr ? "امسح الرمز للتحقق من الفاتورة وفق متطلبات هيئة الزكاة والضريبة." : "Scan to verify invoice per ZATCA e-invoicing requirements."}</p>
      </div>
    </div>
  );
}
