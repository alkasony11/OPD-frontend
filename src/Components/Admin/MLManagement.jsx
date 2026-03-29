import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const MLManagement = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testInput, setTestInput] = useState({
    tokenNumber: '',
    doctorId: '',
    appointmentDate: '',
    timeSlot: '',
    sessionType: 'morning',
    symptoms: ''
  });
  const [testResult, setTestResult] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadModelInfo();
  }, []);

  const loadModelInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/ml/model-info`);
      setModelInfo(response.data.modelInfo);
    } catch (error) {
      console.error('Error loading model info:', error);
      setMessage('Failed to load model information');
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async () => {
    try {
      setTraining(true);
      setMessage('');
      const response = await api.post(`/api/admin/ml/train-model`);
      setMessage(response.data.message);
      await loadModelInfo(); // Refresh model info
    } catch (error) {
      console.error('Error training model:', error);
      setMessage(error.response?.data?.message || 'Failed to train model');
    } finally {
      setTraining(false);
    }
  };

  const retrainModel = async () => {
    try {
      setTraining(true);
      setMessage('');
      const response = await api.post(`/api/admin/ml/retrain-model`);
      setMessage(response.data.message);
      await loadModelInfo(); // Refresh model info
    } catch (error) {
      console.error('Error retraining model:', error);
      setMessage(error.response?.data?.message || 'Failed to retrain model');
    } finally {
      setTraining(false);
    }
  };

  const testPrediction = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setMessage('');

      const response = await api.post(`/api/admin/ml/test-prediction`, testInput);
      setTestResult(response.data);
    } catch (error) {
      console.error('Error testing prediction:', error);
      setMessage(error.response?.data?.message || 'Failed to test prediction');
    } finally {
      setTesting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Machine Learning Management</h1>

      {/* Status Messages */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('success') || message.includes('Success')
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Model Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Model Information</h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : modelInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Status</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    modelInfo.isTrained
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {modelInfo.isTrained ? 'Trained' : 'Not Trained'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Training Data Points</label>
                  <span className="text-lg font-semibold text-gray-800">
                    {modelInfo.trainingDataPoints || 0}
                  </span>
                </div>
              </div>

              {modelInfo.lastTrained && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Last Trained</label>
                  <span className="text-gray-800">{formatDate(modelInfo.lastTrained)}</span>
                </div>
              )}

              {modelInfo.accuracy && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Model Accuracy</label>
                  <span className="text-lg font-semibold text-green-600">
                    {(modelInfo.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  The ML model uses linear regression to predict patient wait times based on:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Number of patients ahead in queue</li>
                  <li>• Doctor's average consultation time</li>
                  <li>• Time of day and day of week</li>
                  <li>• Session type (morning/afternoon)</li>
                  <li>• Historical appointment data</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No model information available
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={trainModel}
              disabled={training}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {training ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Training Model...
                </>
              ) : (
                'Train New Model'
              )}
            </button>

            <button
              onClick={retrainModel}
              disabled={training || !modelInfo?.isTrained}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {training ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Retraining...
                </>
              ) : (
                'Retrain Model'
              )}
            </button>

            <button
              onClick={loadModelInfo}
              disabled={loading}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refresh Info
            </button>
          </div>
        </div>

        {/* Test Prediction */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Prediction</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Token Number *
                </label>
                <input
                  type="number"
                  value={testInput.tokenNumber}
                  onChange={(e) => setTestInput({...testInput, tokenNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Doctor ID *
                </label>
                <input
                  type="text"
                  value={testInput.doctorId}
                  onChange={(e) => setTestInput({...testInput, doctorId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Doctor ID"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Appointment Date
                </label>
                <input
                  type="date"
                  value={testInput.appointmentDate}
                  onChange={(e) => setTestInput({...testInput, appointmentDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Time Slot
                </label>
                <input
                  type="time"
                  value={testInput.timeSlot}
                  onChange={(e) => setTestInput({...testInput, timeSlot: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Session Type
                </label>
                <select
                  value={testInput.sessionType}
                  onChange={(e) => setTestInput({...testInput, sessionType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Symptoms (optional)
                </label>
                <input
                  type="text"
                  value={testInput.symptoms}
                  onChange={(e) => setTestInput({...testInput, symptoms: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., fever, cough"
                />
              </div>
            </div>

            <button
              onClick={testPrediction}
              disabled={testing || !testInput.tokenNumber || !testInput.doctorId}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Testing...
                </>
              ) : (
                'Test Prediction'
              )}
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Prediction Result</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Predicted Wait Time:</span>
                  <span className="ml-2 text-lg font-bold text-blue-600">
                      {Number.isFinite(testResult.prediction?.predictedWait)
                        ? Math.round(testResult.prediction.predictedWait)
                        : 'N/A'} minutes
                  </span>
                </div>
                <div>
                  <span className="font-medium">Input Data:</span>
                  <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(testResult.input, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ML Explanation */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">How the ML Model Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Algorithm</h3>
            <p className="text-sm text-gray-600">
              Uses Linear Regression to predict wait times based on multiple factors.
              The model learns from historical appointment data to make accurate predictions.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Features Used</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Queue position (token number)</li>
              <li>• Doctor consultation speed</li>
              <li>• Time of day patterns</li>
              <li>• Day of week trends</li>
              <li>• Session type (morning/afternoon)</li>
            </ul>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="font-medium text-gray-700 mb-2">Benefits</h3>
          <p className="text-sm text-gray-600">
            Provides accurate wait time predictions for patients, improves queue management,
            reduces patient anxiety, and helps optimize doctor schedules for better efficiency.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MLManagement;