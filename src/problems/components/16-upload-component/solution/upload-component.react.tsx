import { useRef, useState } from 'react'
import { ProgressBar } from '../../15-progress-bar/progress-bar.react'
import css from './upload-component.module.css'
import flex from '@course/styles'
import cx from '@course/cx'
import { useFileUpload } from './use-upload'

export const UploadComponent = () => {
  const [uploadState, uploadControls] = useFileUpload()
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      uploadControls.start(selectedFile)
    }
  }

  const handleCancel = () => {
    uploadControls.cancel()
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleResume = () => {
    if (file) {
      uploadControls.resume(file)
    }
  }

  const formatSpeed = (speedKBps: number) => {
    if (speedKBps === 0) return ''
    if (speedKBps > 1024) {
      return `${(speedKBps / 1024).toFixed(2)} MB/s`
    }
    return `${Math.round(speedKBps)} KB/s`
  }

  const formatTime = (ms: number | null) => {
    if (ms === null || ms < 0) return ''
    const seconds = Math.ceil(ms / 1000)
    if (seconds < 60) return `${seconds}s left`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s left`
  }

  const { status, progress, speed, error, remainingTimeMs } = uploadState

  return (
    <div className={cx(flex.shadow1, flex.br8, flex.bgWhite10, css.container)}>
      <h3>Real Upload Component</h3>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {!file && (
        <button onClick={() => fileInputRef.current?.click()} className={cx(css.selectButton, flex.cWhite10, flex.bNone)}>
          Select File to Upload
        </button>
      )}

      {file && (
        <div className={flex.flexColumnGap16}>
          <div className={flex.flexRowBetween}>
            <span className={css.fileName}>{file.name}</span>
            <div className={flex.flexColumnGap4} style={{ alignItems: 'flex-end' }}>
              <span className={css.speed}>
                {status === 'uploading' && formatSpeed(speed)}
                {status === 'paused' && 'Paused'}
                {status === 'completed' && 'Completed'}
                {status === 'error' && 'Error'}
              </span>
              {status === 'uploading' && remainingTimeMs !== null && (
                <span className={css.speed} style={{ fontSize: '0.8em', opacity: 0.8 }}>
                  {formatTime(remainingTimeMs)}
                </span>
              )}
            </div>
          </div>

          <ProgressBar
            value={progress}
            label={
              status === 'completed'
                ? 'Upload Complete'
                : status === 'error'
                  ? 'Failed'
                  : `${Math.round(progress)}%`
            }
          />

          {error && <div className={css.error}>{error}</div>}

          <div className={cx(flex.flexRowGap8, flex.justifyEnd)}>
            {status === 'uploading' && (
              <button onClick={uploadControls.pause} className={cx(css.controlButton, flex.br4)}>
                Pause
              </button>
            )}
            {status === 'paused' && (
              <button onClick={handleResume} className={cx(css.controlButton, flex.br4)}>
                Resume
              </button>
            )}
            {status !== 'completed' && (
              <button onClick={handleCancel} className={cx(css.controlButton, css.cancelButton, flex.br4)}>
                Cancel
              </button>
            )}
            {status === 'completed' && (
              <button
                onClick={() => {
                  handleCancel()
                  fileInputRef.current?.click()
                }}
                className={cx(css.controlButton, flex.br4)}
              >
                Upload Another
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
