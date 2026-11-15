import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  UploadCloud,
  FileText,
  RotateCw,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { plannerApi } from '../../api/plannerApi';
import { useToast } from '../../context/ToastContext';
import { extractTextFromFile } from '../../utils/pdfExtractor';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import Skeleton from '../common/Skeleton';
import PlannerChecklist from './PlannerChecklist';

const PlannerGenerator = ({ classroom }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);

  const [extractedSyllabusText, setExtractedSyllabusText] = useState('');
  const [numberOfDays, setNumberOfDays] = useState('45');
  const [isCached, setIsCached] = useState(false);
  const [days, setDays] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Load existing planner if already generated
  const fetchExistingPlanner = async () => {
    if (!classroom?._id) return;
    setLoading(true);
    try {
      const res = await plannerApi.getPlanner(classroom._id);
      if (res?.days && res.days.length > 0) {
        setDays(res.days);
        setIsCached(true);
      }
    } catch (err) {
      // 404 or empty is fine if no plan exists yet
      console.log('No prior planner found for class.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExistingPlanner();
  }, [classroom?._id]);

  // Handle File Upload and Extraction
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    setExtractProgress(10);
    setErrorMessage('');

    try {
      const text = await extractTextFromFile(file, (progress) => {
        setExtractProgress(progress);
      });

      if (!text || text.length < 15) {
        throw new Error('Insufficient syllabus content detected. Please paste the syllabus text.');
      }

      setExtractedSyllabusText(text);
      toast.success(`Extracted syllabus text from "${file.name}"!`);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to parse syllabus file. Please paste syllabus text manually.');
      toast.error('File parsing failed.');
    } finally {
      setExtracting(false);
      setExtractProgress(0);
    }
  };

  // Generate or Regenerate Planner
  const handleGenerate = async (regenerate = false) => {
    setErrorMessage('');

    if (!extractedSyllabusText || extractedSyllabusText.trim().length < 20) {
      setErrorMessage('Please upload a syllabus file or paste syllabus text (at least 20 characters).');
      return;
    }

    const daysCount = parseInt(numberOfDays, 10);
    if (isNaN(daysCount) || daysCount < 1) {
      setErrorMessage('Number of teaching days must be a positive integer.');
      return;
    }

    setGenerating(true);
    try {
      const res = await plannerApi.generatePlanner({
        classId: classroom._id,
        extractedSyllabusText: extractedSyllabusText.trim(),
        numberOfDays: daysCount,
        regenerate,
      });

      if (res?.days) {
        setDays(res.days);
        setIsCached(!!res.cached);
        toast.success(res.message || 'AI Lesson Plan generated successfully!');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate syllabus plan with AI.');
      toast.error(err.message || 'AI generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDayUpdated = (updatedDay) => {
    setDays((prev) =>
      prev.map((d) => (d.dayNumber === updatedDay.dayNumber ? updatedDay : d))
    );
  };

  return (
    <div>
      {/* Top Banner: Cached indicator and Regenerate button */}
      {isCached && days.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.15rem',
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Badge variant="accent">Previously Generated Plan</Badge>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Loaded {days.length} teaching modules from institutional cache.
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RotateCw}
            loading={generating}
            onClick={() => handleGenerate(true)}
            title="Re-run AI Syllabus generator"
          >
            Regenerate Plan
          </Button>
        </div>
      )}

      {/* Generator Form Section */}
      <div
        style={{
          padding: '1.35rem',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            AI Course Syllabus & Lesson Planner
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Upload course curriculum PDF/image or paste syllabus topics to automatically generate a day-by-day lesson breakdown.
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 0.85rem',
              backgroundColor: 'var(--status-danger-bg)',
              border: '1px solid var(--status-danger-border)',
              color: 'var(--status-danger-text)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {/* File Upload Drop Area */}
        <div
          style={{
            border: '2px dashed var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface-subtle)',
            marginBottom: '1.25rem',
            position: 'relative',
          }}
        >
          <input
            id="syllabus-file-upload"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.txt,.md"
            onChange={handleFileUpload}
            disabled={extracting || generating}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              cursor: 'pointer',
              width: '100%',
              height: '100%',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
            <UploadCloud size={32} style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {extracting ? `Processing File & OCR (${extractProgress}%)...` : 'Upload Syllabus Document (PDF, Image, Text)'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Drag and drop or click to browse. Automatic text extraction and OCR will process the syllabus.
            </div>
          </div>
        </div>

        {/* Syllabus Text Input & Number of Days */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" htmlFor="syllabus-text-area" style={{ marginBottom: 0 }}>
                Syllabus Topics / Extracted Content <span className="required-indicator">*</span>
              </label>
              {extractedSyllabusText && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {extractedSyllabusText.length} characters • Cleaned & Structured
                </span>
              )}
            </div>
            <textarea
              id="syllabus-text-area"
              rows={4}
              className="form-control font-mono"
              placeholder="Unit 1: Introduction to Trees and Binary Search Trees... Unit 2: Graph Algorithms (BFS, DFS, Dijkstra)..."
              value={extractedSyllabusText}
              onChange={(e) => setExtractedSyllabusText(e.target.value)}
              style={{ resize: 'vertical', fontSize: '0.85rem' }}
            />
          </div>

          {/* Quick Schedule Duration Presets & Input */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Target Teaching Duration:
              </span>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  { label: '15 Days (Intensive)', val: '15' },
                  { label: '30 Days (Standard)', val: '30' },
                  { label: '45 Days (Semester)', val: '45' },
                  { label: '60 Days (Deep Dive)', val: '60' },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setNumberOfDays(preset.val)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      border: numberOfDays === preset.val ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      backgroundColor: numberOfDays === preset.val ? 'var(--accent-subtle)' : 'var(--bg-surface-subtle)',
                      color: numberOfDays === preset.val ? 'var(--accent-text)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: numberOfDays === preset.val ? 600 : 400,
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ width: '220px' }}>
                <Input
                  id="planner-days-input"
                  label="Total Teaching Days"
                  type="number"
                  min="5"
                  max="180"
                  icon={Clock}
                  value={numberOfDays}
                  onChange={(e) => setNumberOfDays(e.target.value)}
                  required
                  hint="Custom number of sessions (5 - 180)"
                  className="mb-0"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', maxWidth: '340px' }}>
                  AI dynamically decomposes units into subtopics & revision for long durations, or condenses into core lectures for short durations.
                </span>
                <Button
                  id="generate-planner-submit-btn"
                  variant="primary"
                  icon={Sparkles}
                  loading={generating || extracting}
                  onClick={() => handleGenerate(false)}
                >
                  {isCached ? 'Generate New AI Plan' : 'Generate Day-by-Day Plan'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Display Section */}
      {loading ? (
        <Skeleton height="280px" />
      ) : days.length > 0 ? (
        <PlannerChecklist
          classId={classroom._id}
          days={days}
          onDayUpdated={handleDayUpdated}
        />
      ) : null}
    </div>
  );
};

export default PlannerGenerator;
