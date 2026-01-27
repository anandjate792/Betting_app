"use client";

import { useState, useRef } from "react";
import { useAppStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Upload, Copy, Smartphone } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function WalletPage() {
  const { user, addTransaction } = useAppStore();
  const [transactionAmount, setTransactionAmount] = useState<string>("");
  const [transactionDescription, setTransactionDescription] = useState<string>("");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setScreenshotImage(base64String);
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitTransaction = async () => {
    if (!transactionAmount || !transactionDescription || !utrNumber) {
      alert("Please fill in all fields including UTR number");
      return;
    }

    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a positive amount only");
      return;
    }

    if (amount < 100) {
      alert("Minimum deposit amount is ₹100");
      return;
    }

    setTransactionLoading(true);
    try {
      await addTransaction(
        amount,
        `${transactionDescription} (UTR: ${utrNumber})`,
        screenshotImage || undefined
      );
      setTransactionAmount("");
      setTransactionDescription("");
      setUtrNumber("");
      setScreenshotImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      alert("Transaction submitted successfully! It will be reviewed by admin.");
    } catch (error) {
      console.error("Failed to submit transaction:", error);
      alert("Failed to submit transaction. Please try again.");
    } finally {
      setTransactionLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Wallet Balance */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wallet className="w-5 h-5" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-400">
            ₹{user?.walletBalance.toFixed(2) || "0.00"}
          </div>
          <p className="text-slate-400 text-sm mt-2">Your current wallet balance</p>
        </CardContent>
      </Card>

      {/* UPI Payment Details */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Smartphone className="w-5 h-5" />
            UPI Payment Details
          </CardTitle>
          <CardDescription className="text-slate-400">
            Scan the QR code or use the UPI ID to make a payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* QR Code */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 bg-white p-4 rounded-lg">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=sahilsiddiqui2627ss@oksbi&pn=Sahil%20Siddiqui&am=100&cu=INR"
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-center text-slate-400 text-sm mt-2">Scan to Pay</p>
            </div>
            
            {/* UPI Details */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  UPI ID
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value="sahilsiddiqui2627ss@oksbi"
                    readOnly
                    className="bg-slate-700 border-slate-600 text-white flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigator.clipboard.writeText('sahilsiddiqui2627ss@oksbi')}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Account Holder
                </label>
                <Input
                  type="text"
                  value="Sahil Siddiqui"
                  readOnly
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bank
                </label>
                <Input
                  type="text"
                  value="State Bank of India"
                  readOnly
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div> */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Transaction */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Upload Transaction</CardTitle>
          <CardDescription className="text-slate-400">
            Upload a screenshot of your Gpay transaction to add money to your wallet (Minimum: ₹100)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Amount
            </label>
            <Input
              type="number"
              placeholder="Enter amount (Minimum: ₹100)"
              value={transactionAmount}
              onChange={(e) => setTransactionAmount(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              UTR Number
            </label>
            <Input
              type="text"
              placeholder="Enter UTR number"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <Input
              type="text"
              placeholder="Transaction description"
              value={transactionDescription}
              onChange={(e) => setTransactionDescription(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Screenshot
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="screenshot-upload"
            />
            <label
              htmlFor="screenshot-upload"
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-slate-400">
                {imagePreview ? "Change Image" : "Upload Screenshot"}
              </span>
            </label>
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Screenshot preview"
                  className="w-full max-h-64 object-contain rounded-lg border border-slate-600"
                />
              </div>
            )}
          </div>
          <Button
            onClick={handleSubmitTransaction}
            disabled={transactionLoading || !transactionAmount || !transactionDescription || !utrNumber}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {transactionLoading ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Transaction"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

