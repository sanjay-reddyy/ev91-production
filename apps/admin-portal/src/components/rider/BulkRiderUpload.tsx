import React, { useState, useRef } from 'react';
import {
  CloudUpload as Upload,
  CheckCircle,
  Cancel as XCircle,
  Loop as Loader,
  Download,
  Warning as AlertCircle,
  Description as FileText,
  Group as Users
} from '@mui/icons-material';
import axios from 'axios';

interface UploadProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  percentage: number;
}

interface UploadError {
  row: number;
  error: string;
  data?: any;
}

export const BulkRiderUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [errors, setErrors] = useState<UploadError[]>([]);
  const [validationMode, setValidationMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setErrors([]);
      setStatus('idle');
      setProgress(null);
    }
  };

  const validateCsv = async () => {
    if (!file) return;

    setUploading(true);
    setValidationMode(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('validateOnly', 'true');

    try {
      const response = await axios.post('/api/v1/riders/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.isValid) {
        alert(`✅ Validation passed!\n\n${response.data.totalRecords} records are ready to upload.`);
        setErrors([]);
      } else {
        setErrors(response.data.errors || []);
        alert(
          `❌ Validation failed!\n\n${response.data.errors?.length || 0} errors found.\n\nCheck the errors list below for details.`
        );
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Validation failed';
      alert(`❌ Validation Error:\n\n${errorMsg}`);
    } finally {
      setUploading(false);
      setValidationMode(false);
    }
  };

  const startUpload = async () => {
    if (!file) return;

    if (!confirm('⚠️ This will start importing all riders from the CSV file.\n\nAre you sure you want to proceed?')) {
      return;
    }

    setUploading(true);
    setStatus('processing');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('validateOnly', 'false');
    formData.append('skipExisting', 'true');
    formData.append('downloadKycDocuments', 'true');
    formData.append('batchSize', '100');

    try {
      const response = await axios.post('/api/v1/riders/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadId(response.data.uploadId);
      // Start polling for status
      pollUploadStatus(response.data.uploadId);
    } catch (error: any) {
      console.error('Upload error:', error);
      setStatus('failed');
      const errorMsg = error.response?.data?.error || error.message || 'Upload failed to start';
      alert(`❌ Upload Error:\n\n${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  const pollUploadStatus = async (id: string) => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const poll = setInterval(async () => {
      try {
        const response = await axios.get(`/api/v1/riders/bulk-upload/${id}/status`);
        const data = response.data;

        setProgress(data.progress);
        setStatus(data.status);
        setErrors(data.errors || []);

        if (data.status === 'completed') {
          clearInterval(poll);
          pollIntervalRef.current = null;
          alert(`✅ Upload completed successfully!\n\n${data.progress.successful} riders imported successfully.\n${data.progress.failed} failed.`);
        } else if (data.status === 'failed') {
          clearInterval(poll);
          pollIntervalRef.current = null;
          alert('❌ Upload failed. Check the error log for details.');
        }
      } catch (error) {
        console.error('Status poll error:', error);
        clearInterval(poll);
        pollIntervalRef.current = null;
        setStatus('failed');
      }
    }, 2000); // Poll every 2 seconds

    pollIntervalRef.current = poll;
  };

  const downloadTemplate = () => {
    const csvContent = `name,phone,email,dob,address1,address2,city,state,pincode,emergencyName,emergencyPhone,emergencyRelation,aadhaarNumber,panNumber,dlNumber,panDocumentUrl,aadhaarDocumentUrl,dlDocumentUrl,selfieUrl
John Doe,9876543210,john@example.com,1990-01-15,123 Main St,Apt 4B,Mumbai,Maharashtra,400001,Jane Doe,9876543211,Wife,123456789012,ABCDE1234F,MH1234567890,https://drive.google.com/file/d/FILE_ID/view,https://drive.google.com/file/d/FILE_ID/view,https://drive.google.com/file/d/FILE_ID/view,https://drive.google.com/file/d/FILE_ID/view
Jane Smith,9876543212,jane@example.com,1992-05-20,456 Park Ave,,Delhi,Delhi,110001,John Smith,9876543213,Husband,987654321098,FGHIJ5678K,DL9876543210,https://drive.google.com/file/d/FILE_ID/view,https://drive.google.com/file/d/FILE_ID/view,https://drive.google.com/file/d/FILE_ID/view,https://drive.google.com/file/d/FILE_ID/view`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rider_bulk_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadErrors = async () => {
    if (!uploadId) return;

    try {
      const response = await axios.get(`/api/v1/riders/bulk-upload/${uploadId}/errors`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk-upload-errors-${uploadId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading errors:', error);
      alert('Failed to download errors');
    }
  };

  const resetUpload = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setFile(null);
    setUploadId(null);
    setProgress(null);
    setStatus('idle');
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Users sx={{ width: 32, height: 32 }} className="text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bulk Rider Import</h2>
              <p className="text-sm text-gray-600 mt-1">
                Upload multiple riders from CSV with Google Drive KYC documents
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Template Download Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">Step 1: Download Template</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Download the CSV template with all required columns and example data.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download sx={{ fontSize: 18 }} />
                  Download CSV Template
                </button>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Step 2: Upload Your CSV File</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <span className="text-sm font-medium text-gray-700 mb-1">
                  Click to upload CSV file
                </span>
                <span className="text-xs text-gray-500">
                  or drag and drop
                </span>
              </label>
              {file && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg inline-flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={validateCsv}
              disabled={!file || uploading || status === 'processing'}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {validationMode && <Loader className="animate-spin" sx={{ fontSize: 20 }} />}
              <AlertCircle sx={{ fontSize: 20 }} />
              Validate Only
            </button>
            <button
              onClick={startUpload}
              disabled={!file || uploading || status === 'processing'}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {uploading && <Loader className="animate-spin" sx={{ fontSize: 20 }} />}
              <Upload sx={{ fontSize: 20 }} />
              Start Import
            </button>
            {(status === 'completed' || status === 'failed') && (
              <button
                onClick={resetUpload}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Progress Section */}
          {progress && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">
                  Import Progress
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {progress.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-700">
                    {progress.total}
                  </div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {progress.processed}
                  </div>
                  <div className="text-xs text-gray-500">Processed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                    <CheckCircle sx={{ fontSize: 20 }} />
                    {progress.successful}
                  </div>
                  <div className="text-xs text-gray-500">Successful</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                    <XCircle sx={{ fontSize: 20 }} />
                    {progress.failed}
                  </div>
                  <div className="text-xs text-gray-500">Failed</div>
                </div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {status !== 'idle' && (
            <div
              className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
                status === 'completed'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : status === 'failed'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {status === 'processing' && <Loader className="animate-spin" sx={{ fontSize: 20 }} />}
              {status === 'completed' && <CheckCircle sx={{ fontSize: 20 }} />}
              {status === 'failed' && <XCircle sx={{ fontSize: 20 }} />}
              <span className="font-medium">
                {status === 'processing' && 'Processing riders... This may take several minutes.'}
                {status === 'completed' && '✅ Import completed successfully!'}
                {status === 'failed' && '❌ Import failed. Check errors below.'}
              </span>
            </div>
          )}

          {/* Errors Section */}
          {errors.length > 0 && (
            <div className="mt-6 border border-red-200 rounded-lg overflow-hidden">
              <div className="bg-red-50 p-4 flex items-center justify-between border-b border-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">
                    Errors Found ({errors.length})
                  </h3>
                </div>
                {uploadId && (
                  <button
                    onClick={downloadErrors}
                    className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    <Download sx={{ fontSize: 16 }} />
                    Download Errors CSV
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 w-20">Row</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {errors.slice(0, 50).map((err, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">{err.row}</td>
                        <td className="px-4 py-2 text-gray-700">{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {errors.length > 50 && (
                  <div className="p-3 bg-gray-50 text-center text-sm text-gray-600 border-t">
                    Showing first 50 errors. Download CSV for full error list.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Important Instructions
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Export your Google Sheet as CSV format</li>
              <li>
                Ensure Google Drive document links are <strong>publicly accessible</strong>
                <ul className="ml-6 mt-1 list-disc list-inside text-xs text-gray-600">
                  <li>Right-click file → Share → "Anyone with link can view"</li>
                  <li>Supported formats: https://drive.google.com/file/d/FILE_ID/view</li>
                </ul>
              </li>
              <li>Click "Validate Only" to check for errors before importing</li>
              <li>Fix any validation errors in your spreadsheet and re-export</li>
              <li>Click "Start Import" to begin the bulk upload</li>
              <li>
                Processing time: ~30-45 minutes for 13,000 riders
                <span className="text-xs text-gray-600 ml-1">(4 documents each)</span>
              </li>
              <li>Keep this tab open during the import process</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
