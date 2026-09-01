import { useEffect, useState } from 'react'
import { useAssistant } from '../../store/assistant'
import { Card, SecTitle } from '../ui/Card'
import { Inp, SelEl, FIELD_LABEL } from '../ui/Input'
import { Btn } from '../ui/Button'

const PROVIDERS = [{ value: 'gemini', label: 'Google Gemini' }]

export function AssistantSettings() {
  const { status, statusLoaded, refreshStatus, saveKey, saveModel, removeKey } = useAssistant()
  const [provider, setProvider] = useState('gemini')
  const [model, setModel] = useState('gemini-2.5-flash')
  const [keyInput, setKeyInput] = useState('')
  const [editingKey, setEditingKey] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)

  useEffect(() => {
    if (!statusLoaded) void refreshStatus()
  }, [statusLoaded, refreshStatus])

  useEffect(() => {
    if (status) {
      setProvider(status.provider)
      setModel(status.model)
    }
  }, [status])

  const hasKey = status?.hasKey ?? false

  async function run(fn: () => Promise<void>, okMsg: string) {
    setBusy(true); setErr(''); setMsg('')
    try {
      await fn()
      setMsg(okMsg)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const onSaveKey = () =>
    run(async () => {
      await saveKey(keyInput.trim(), provider, model)
      setKeyInput('')
      setEditingKey(false)
    }, 'API key saved')

  const onSaveModel = () => run(() => saveModel(model), 'Model updated')
  const onRemove = () => { setConfirmRemove(false); return run(() => removeKey(), 'API key removed') }

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <SecTitle className="mb-1.5">Assistant</SecTitle>
        <p className="text-xs text-ink-2 leading-[1.4]">
          Add an API key to enable the in-app assistant. Your key is stored securely on the server and is
          never shown again — only the last 4 characters are displayed.
        </p>
      </div>

      <SelEl
        label="Provider"
        options={PROVIDERS}
        value={provider}
        onChange={e => setProvider(e.target.value)}
      />

      {/* API key */}
      {hasKey && !editingKey ? (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className={FIELD_LABEL}>API key</p>
            <p className="text-xs text-ink font-mono mt-1">•••• •••• {status?.last4}</p>
          </div>
          {/* Removing the key is destructive, so what makes it safe is the
              confirm step, not a colour (§8): outline with the 2px ink border
              asks, and the chip tones answer. */}
          <div className="flex gap-1.5 flex-shrink-0">
            {confirmRemove ? (
              <>
                <Btn small variant="primary" disabled={busy} onClick={onRemove}>Yes, remove</Btn>
                <Btn small variant="secondary" onClick={() => setConfirmRemove(false)}>No</Btn>
              </>
            ) : (
              <>
                <Btn small variant="secondary" onClick={() => { setEditingKey(true); setKeyInput('') }}>Replace</Btn>
                <Btn small variant="danger" disabled={busy} onClick={() => setConfirmRemove(true)}>Remove</Btn>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Inp
            label={hasKey ? 'New API key' : 'API key'}
            type="password"
            autoComplete="off"
            placeholder="Paste your Gemini API key"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
          />
          <div className="flex gap-1.5">
            <Btn small variant="primary" disabled={busy || !keyInput.trim()} onClick={onSaveKey}>Save key</Btn>
            {hasKey && (
              <Btn small variant="ghost" onClick={() => { setEditingKey(false); setKeyInput('') }}>Cancel</Btn>
            )}
          </div>
        </div>
      )}

      {/* Model */}
      <div className="flex items-end gap-2">
        <Inp
          label="Model"
          value={model}
          onChange={e => setModel(e.target.value)}
          placeholder="gemini-2.5-flash"
          className="flex-1"
        />
        {hasKey && (
          <Btn small variant="secondary" disabled={busy || model === status?.model} onClick={onSaveModel}>
            Update
          </Btn>
        )}
      </div>

      {/* Neither outcome takes a colour (§1): the message says what happened,
          and a red failure line would be a second palette. */}
      {msg && <p className="text-[11px] text-ink-2">{msg}</p>}
      {err && <p className="text-[11px] font-semibold text-ink">{err}</p>}
    </Card>
  )
}
