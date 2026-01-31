"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Upload } from "lucide-react";
import { upiSettingsApi } from "@/lib/api";

export default function UpiQrPage() {
  const [upiId, setUpiId] = useState("");
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUpiSettings();
  }, []);

  const loadUpiSettings = async () => {
    setLoading(true);
    try {
      const data = await upiSettingsApi.getUpiSettings();
      setUpiId((data as { upiId: string }).upiId || "");
      const qr = (data as { qrCode: string }).qrCode;
      setQrCodeImage(qr || null);
      setQrPreview(qr || null);
    } catch (error) {
      console.error("Failed to load UPI settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQrImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setQrCodeImage(base64);
        setQrPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upiSettingsApi.updateUpiSettings({
        upiId: upiId.trim(),
        qrCode: qrCodeImage || undefined,
      });
      alert("UPI & QR settings saved. They will show on website and app.");
    } catch (error) {
      console.error("Failed to save UPI settings:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">UPI ID & QR Code</CardTitle>
          <CardDescription className="text-slate-400">
            Set the UPI ID and QR code image shown on the website and mobile app
            when users add money.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-6 h-6 text-blue-400" />
              <p className="ml-3 text-slate-400">Loading UPI settings...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  UPI ID
                </label>
                <Input
                  type="text"
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  QR Code Image
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQrImageSelect}
                  className="hidden"
                  id="qr-upload"
                />
                <label
                  htmlFor="qr-upload"
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors text-slate-400"
                >
                  <Upload className="w-5 h-5" />
                  {qrPreview ? "Change QR image" : "Upload QR code image"}
                </label>
                {qrPreview && (
                  <div className="mt-4 flex flex-col items-start gap-2">
                    <div className="w-40 h-40 bg-white p-2 rounded-lg">
                      <img
                        src={qrPreview}
                        alt="QR preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      This QR will be shown on website and app.
                    </p>
                  </div>
                )}
              </div>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save UPI & QR"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
