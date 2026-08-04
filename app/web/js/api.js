/* Monad api.js — Eel 契约层：main.py 的所有 @eel.expose 函数映射 [1] */
const API = {
  /* 课程 */
  listCourses:   () => eel.api_list_courses()(),
  createCourse:  (name) => eel.api_create_course(name)(),
  getCourse:     (id) => eel.api_get_course(id)(),
  deleteCourse:  (id) => eel.api_delete_course(id)(),

  /* 课堂记录 */
  getLectures:   (courseId) => eel.api_get_lectures(courseId)(),
  getLecture:    (lectureId) => eel.api_get_lecture(lectureId)(),
  generateNote:  (lectureId) => eel.api_generate_note(lectureId)(),

  /* 录音流程 */
  selectAudio:   () => eel.api_select_audio_file()(),
  copyAudio:     (path, courseId) => eel.api_copy_audio(path, courseId)(),
  transcribeAudio: (path, courseId) => eel.api_transcribe_audio(path, courseId)(),
  getTaskStatus: () => eel.api_get_task_status()(),
  clearTaskStatus: () => eel.api_clear_task_status()(),

  /* 文档 / 知识库 */
  selectDocument: () => eel.api_select_document_file()(),
  uploadDocument: (path, courseId) => eel.api_upload_document(path, courseId)(),
  getDocuments:   (courseId) => eel.api_get_documents(courseId)(),
  deleteDocument: (docId) => eel.api_delete_document(docId)(),

  /* 设置 */
  getSetting:    (key) => eel.api_get_setting(key)(),
  saveSetting:   (key, value) => eel.api_save_setting(key, value)(),
  testKey:       (which, key) => eel.api_test_key(which, key)(),

  /* AI Tutor */
  createChatSession: (courseId, lectureId) => eel.api_create_chat_session(courseId, lectureId)(),
  tutorChat:         (sessionId, message) => eel.api_tutor_chat(sessionId, message)(),
  getChatSessions:   (courseId) => eel.api_get_chat_sessions(courseId)(),
  getChatMessages:   (sessionId) => eel.api_get_chat_messages(sessionId)(),
  deleteChatSession: (sessionId) => eel.api_delete_chat_session(sessionId)(),

  /* 测验 & 复习 */
  generateQuizzes: (courseId, lectureId) => eel.api_generate_quizzes(courseId, lectureId)(),
  getQuizzes:      (courseId) => eel.api_get_quizzes(courseId)(),
  getDueReviews:   (courseId) => eel.api_get_due_reviews(courseId)(),
  submitReview:    (reviewId, quality) => eel.api_submit_review(reviewId, quality)(),
  getReviewStats:  (courseId) => eel.api_get_review_stats(courseId)(),
  deleteQuiz:      (quizId) => eel.api_delete_quiz(quizId)(),
};
