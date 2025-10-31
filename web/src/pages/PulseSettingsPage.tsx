import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

type PulseQuestion = {
  id: string
  text: string
  category: string | null
  scale: 'LIKERT_1_5' | 'NPS_0_10'
  active: boolean
  createdAt: string
}

type PulseCohort = {
  id: string
  name: string
  userIds: string[]
  users: Array<{ id: string; name: string | null; email: string }>
  userCount: number
}

type Tab = 'questions' | 'schedule' | 'cohorts'

export function PulseSettingsPage() {
  const navigate = useNavigate()
  const { theme, colorMode } = useTheme()
  const themeColors = colorMode === 'light' ? theme.light : theme.dark

  const [activeTab, setActiveTab] = useState<Tab>('questions')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Questions
  const [questions, setQuestions] = useState<PulseQuestion[]>([])
  const [editingQuestion, setEditingQuestion] = useState<PulseQuestion | null>(
    null
  )
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    category: '',
    scale: 'LIKERT_1_5' as 'LIKERT_1_5' | 'NPS_0_10',
  })
  const [showAddQuestion, setShowAddQuestion] = useState(false)

  // Schedule
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: 1,
    timeOfDay: '09:00',
    rotatingCohorts: true,
    enabled: false,
  })

  // Cohorts
  const [cohorts, setCohorts] = useState<PulseCohort[]>([])

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadQuestions(), loadSchedule(), loadCohorts()])
    } catch (error) {
      console.error('Error loading pulse settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadQuestions = async () => {
    try {
      const response = await fetch(
        'http://localhost:3000/admin/pulse/questions',
        {
          credentials: 'include',
        }
      )
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error('Error loading questions:', error)
    }
  }

  const loadSchedule = async () => {
    try {
      const response = await fetch(
        'http://localhost:3000/admin/pulse/schedule',
        {
          credentials: 'include',
        }
      )
      if (response.ok) {
        const data = await response.json()
        if (data.schedule) {
          setScheduleForm({
            dayOfWeek: data.schedule.dayOfWeek,
            timeOfDay: data.schedule.timeOfDay,
            rotatingCohorts: data.schedule.rotatingCohorts,
            enabled: data.schedule.enabled,
          })
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error)
    }
  }

  const loadCohorts = async () => {
    try {
      const response = await fetch(
        'http://localhost:3000/admin/pulse/cohorts',
        {
          credentials: 'include',
        }
      )
      if (response.ok) {
        const data = await response.json()
        setCohorts(data.cohorts)
      }
    } catch (error) {
      console.error('Error loading cohorts:', error)
    }
  }

  const handleAddQuestion = async () => {
    if (!newQuestion.text.trim()) return

    setSaving(true)
    try {
      const response = await fetch(
        'http://localhost:3000/admin/pulse/questions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            text: newQuestion.text,
            category: newQuestion.category || null,
            scale: newQuestion.scale,
          }),
        }
      )

      if (response.ok) {
        await loadQuestions()
        setNewQuestion({ text: '', category: '', scale: 'LIKERT_1_5' })
        setShowAddQuestion(false)
      }
    } catch (error) {
      console.error('Error adding question:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateQuestion = async (question: PulseQuestion) => {
    setSaving(true)
    try {
      const response = await fetch(
        `http://localhost:3000/admin/pulse/questions/${question.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            text: question.text,
            category: question.category,
            scale: question.scale,
            active: question.active,
          }),
        }
      )

      if (response.ok) {
        await loadQuestions()
        setEditingQuestion(null)
      }
    } catch (error) {
      console.error('Error updating question:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    setSaving(true)
    try {
      const response = await fetch(
        `http://localhost:3000/admin/pulse/questions/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (response.ok) {
        await loadQuestions()
      }
    } catch (error) {
      console.error('Error deleting question:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSchedule = async () => {
    setSaving(true)
    try {
      const response = await fetch(
        'http://localhost:3000/admin/pulse/schedule',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(scheduleForm),
        }
      )

      if (response.ok) {
        await loadSchedule()
        alert('Schedule updated successfully!')
      }
    } catch (error) {
      console.error('Error updating schedule:', error)
    } finally {
      setSaving(false)
    }
  }

  const getDayName = (day: number) => {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]
    return days[day]
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin')}
          className="mb-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          ← Back to Admin
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          💙 Weekly Pulse Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure pulse questions, schedule, and cohorts
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'questions', label: 'Questions', count: questions.length },
            { id: 'schedule', label: 'Schedule' },
            { id: 'cohorts', label: 'Cohorts', count: cohorts.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? ''
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
              style={
                activeTab === tab.id
                  ? {
                      borderBottomColor: themeColors.primary,
                      color: themeColors.primary,
                    }
                  : { borderBottomColor: 'transparent' }
              }
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 dark:bg-gray-700 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'questions' && (
          <div>
            {/* Add Question Button */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Pulse Questions
              </h2>
              <button
                onClick={() => setShowAddQuestion(true)}
                className="px-4 py-2 text-white font-medium rounded-md shadow-sm transition-all hover:opacity-90"
                style={{ backgroundColor: themeColors.primary }}
              >
                + Add Question
              </button>
            </div>

            {/* Add Question Form */}
            {showAddQuestion && (
              <div
                className="mb-6 p-6 rounded-lg border"
                style={{
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                }}
              >
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  New Question
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Text *
                    </label>
                    <textarea
                      value={newQuestion.text}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, text: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      rows={3}
                      placeholder="How would you rate..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                      </label>
                      <input
                        type="text"
                        value={newQuestion.category}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            category: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                        placeholder="e.g., wellbeing, recognition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Scale *
                      </label>
                      <select
                        value={newQuestion.scale}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            scale: e.target.value as 'LIKERT_1_5' | 'NPS_0_10',
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      >
                        <option value="LIKERT_1_5">1-5 Scale (Likert)</option>
                        <option value="NPS_0_10">0-10 Scale (NPS)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddQuestion}
                      disabled={!newQuestion.text.trim() || saving}
                      className="px-4 py-2 text-white font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: themeColors.primary }}
                    >
                      {saving ? 'Saving...' : 'Save Question'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddQuestion(false)
                        setNewQuestion({
                          text: '',
                          category: '',
                          scale: 'LIKERT_1_5',
                        })
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No questions yet. Add your first question above!
                </div>
              ) : (
                questions.map((question) => (
                  <div
                    key={question.id}
                    className="p-6 rounded-lg border"
                    style={{
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                    }}
                  >
                    {editingQuestion?.id === question.id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <textarea
                          value={editingQuestion.text}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              text: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                          rows={3}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={editingQuestion.category || ''}
                            onChange={(e) =>
                              setEditingQuestion({
                                ...editingQuestion,
                                category: e.target.value,
                              })
                            }
                            className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                            placeholder="Category"
                          />
                          <select
                            value={editingQuestion.scale}
                            onChange={(e) =>
                              setEditingQuestion({
                                ...editingQuestion,
                                scale: e.target.value as
                                  | 'LIKERT_1_5'
                                  | 'NPS_0_10',
                              })
                            }
                            className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                          >
                            <option value="LIKERT_1_5">1-5 Scale</option>
                            <option value="NPS_0_10">0-10 Scale</option>
                          </select>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() =>
                              handleUpdateQuestion(editingQuestion)
                            }
                            disabled={saving}
                            className="px-4 py-2 text-white font-medium rounded-md"
                            style={{ backgroundColor: themeColors.primary }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingQuestion(null)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-lg text-gray-900 dark:text-gray-100 mb-2">
                            {question.text}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            {question.category && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                {question.category}
                              </span>
                            )}
                            <span>
                              {question.scale === 'LIKERT_1_5'
                                ? '1-5 Scale'
                                : '0-10 Scale (NPS)'}
                            </span>
                            <span
                              className={
                                question.active
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-gray-500'
                              }
                            >
                              {question.active ? '✓ Active' : '○ Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => setEditingQuestion(question)}
                            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateQuestion({
                                ...question,
                                active: !question.active,
                              })
                            }
                            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            {question.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="px-3 py-1 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Pulse Schedule
            </h2>
            <div
              className="p-6 rounded-lg border space-y-6"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              }}
            >
              {/* Enable/Disable */}
              <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <label className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Enable Pulse Invitations
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Start sending automated weekly pulse invitations
                  </p>
                </div>
                <button
                  onClick={() =>
                    setScheduleForm({
                      ...scheduleForm,
                      enabled: !scheduleForm.enabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    scheduleForm.enabled
                      ? 'bg-green-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      scheduleForm.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Day of Week */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Day of Week
                </label>
                <select
                  value={scheduleForm.dayOfWeek}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      dayOfWeek: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                >
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Invitations will be sent every{' '}
                  {getDayName(scheduleForm.dayOfWeek)}
                </p>
              </div>

              {/* Time of Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time of Day
                </label>
                <input
                  type="time"
                  value={scheduleForm.timeOfDay}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      timeOfDay: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Server timezone:{' '}
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>

              {/* Rotating Cohorts */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={scheduleForm.rotatingCohorts}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      rotatingCohorts: e.target.checked,
                    })
                  }
                  className="mt-1 mr-3"
                />
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Use Rotating Cohorts
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Distribute invitations across cohorts to ensure no user
                    receives more than 1 invitation per week
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleUpdateSchedule}
                  disabled={saving}
                  className="px-6 py-2 text-white font-medium rounded-md transition-all disabled:opacity-50"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  {saving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cohorts' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Pulse Cohorts
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Users are automatically divided into 5 cohorts (weekday-0 through
              weekday-4) for rotation. Each cohort receives invitations on a
              different day of the week.
            </p>
            <div className="space-y-4">
              {cohorts.map((cohort) => (
                <div
                  key={cohort.id}
                  className="p-6 rounded-lg border"
                  style={{
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {cohort.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {cohort.userCount} user
                        {cohort.userCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {cohort.users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                          {user.name?.charAt(0) || user.email.charAt(0)}
                        </span>
                        <span>{user.name || user.email}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          ({user.email})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
