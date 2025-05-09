// Backend/functions/backend.js
const admin = require('firebase-admin');
const { OpenAI } = require('openai');
const fs = require('fs'); // Để đọc file key local cho dev
const path = require('path'); // Để tạo đường dẫn file local cho dev

// --- CONFIGURATION ---
// Lấy các biến môi trường
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const FIREBASE_SERVICE_ACCOUNT_JSON_STRING = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET;
// const COMPDFKIT_API_KEY = process.env.COMPDFKIT_API_KEY; // Sẽ dùng nếu tích hợp OCR
// const COMPDFKIT_OCR_ENDPOINT_URL = process.env.COMPDFKIT_OCR_ENDPOINT_URL; // Sẽ dùng nếu tích hợp OCR

// --- INITIALIZE Firebase Admin SDK ---
let db, storage;
try {
    let serviceAccount;
    // Ưu tiên đọc từ biến môi trường (cho Netlify deploy)
    if (FIREBASE_SERVICE_ACCOUNT_JSON_STRING) {
        serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON_STRING);
        console.log("Firebase service account parsed from ENV variable.");
    }
    // Nếu chạy local dev (netlify dev) và biến môi trường JSON không có, thử đọc từ file
    // Điều này giúp dễ dàng dev local mà không cần paste JSON dài vào .env
    else if (process.env.NETLIFY_DEV) { // Biến này được Netlify CLI tự đặt
        try {
            // Đường dẫn đến file firebase-key.json so với thư mục hiện tại của backend.js
            // __dirname là thư mục Backend/functions/
            // Chúng ta cần đi lên một cấp (Backend/) rồi vào firebase-key.json
            const keyPath = path.resolve(__dirname, '../firebase-key.json');
            if (fs.existsSync(keyPath)) {
                serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
                console.log("Firebase service account loaded from local file for Netlify Dev.");
            } else {
                console.warn(`Local firebase-key.json not found at ${keyPath} for Netlify Dev. Firebase might not initialize if ENV var is also missing.`);
            }
        } catch (e) {
            console.error("Error reading local firebase-key.json for Netlify Dev:", e.message);
        }
    }

    if (serviceAccount) {
        if (!admin.apps.length) { // Chỉ khởi tạo nếu chưa có app nào được khởi tạo
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: FIREBASE_STORAGE_BUCKET // Quan trọng cho việc tương lai nếu backend cần truy cập Storage
            });
            console.log("Firebase Admin SDK initialized successfully.");
        } else {
            console.log("Firebase Admin SDK already initialized.");
        }
        db = admin.firestore();
        if (FIREBASE_STORAGE_BUCKET) {
            // storage = admin.storage().bucket(FIREBASE_STORAGE_BUCKET); // Dùng nếu backend cần thao tác với file
        } else {
            console.warn("FIREBASE_STORAGE_BUCKET not configured. Backend file operations via Admin SDK might be limited.");
        }
    } else {
        console.error("Firebase Service Account credentials not found. Firebase Admin SDK NOT initialized.");
    }
} catch (e) {
    console.error("FATAL ERROR initializing Firebase Admin SDK:", e.message, "\nStack:", e.stack);
    // db và storage sẽ là undefined, các hàm sử dụng chúng cần kiểm tra
}

// --- INITIALIZE OpenAI Client ---
let openai;
if (OPENAI_API_KEY) {
    try {
        openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        console.log("OpenAI client initialized.");
    } catch (e) {
        console.error("Error initializing OpenAI client:", e.message);
    }
} else {
    console.warn("OPENAI_API_KEY not found in environment variables. OpenAI features will be disabled or mocked.");
}

// --- MAIN HANDLER ---
exports.handler = async (event, context) => {
    // CORS Headers
    const headers = {
        'Access-Control-Allow-Origin': '*', // Hoặc domain cụ thể của bạn khi deploy
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    try {
        let body = {};
        if (event.body) {
            try {
                body = JSON.parse(event.body);
            } catch (e) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
            }
        }

        const action = body.action || event.queryStringParameters?.action;
        const payload = body.payload || body;
        const userId = payload.userId || event.queryStringParameters?.userId; // userId quan trọng

        // Kiểm tra service readiness
        if (['submit_attempt', 'generate_outline_only'].includes(action) && !openai) {
            return { statusCode: 503, headers, body: JSON.stringify({ error: 'AI service (OpenAI) unavailable.' }) };
        }
        if (['submit_attempt', 'delete_attempt', 'get_attempt_details', 'get_all_user_paper_statuses'].includes(action) && !db) {
             return { statusCode: 503, headers, body: JSON.stringify({ error: 'Database service (Firestore) unavailable.' }) };
        }
        if (!userId && ['submit_attempt', 'delete_attempt', 'get_attempt_details', 'get_all_user_paper_statuses'].includes(action)) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: `Missing userId for action: ${action}` }) };
        }


        switch (action) {
            case 'submit_attempt':
                if (event.httpMethod !== 'POST') return methodNotAllowed(headers, 'POST');
                return await handleSubmitAttempt(payload, headers, context);

            case 'delete_attempt':
                if (!['POST', 'DELETE'].includes(event.httpMethod)) return methodNotAllowed(headers, 'POST or DELETE');
                return await handleDeleteAttempt(payload, headers, context);

            case 'get_attempt_details':
                if (event.httpMethod !== 'GET') return methodNotAllowed(headers, 'GET');
                const attemptIdForGet = event.queryStringParameters?.attemptId;
                if (!attemptIdForGet) {
                    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing attemptId parameter.' }) };
                }
                return await handleGetAttemptDetails(attemptIdForGet, userId, headers, context);

            case 'generate_outline_only':
                 if (event.httpMethod !== 'POST') return methodNotAllowed(headers, 'POST');
                 return await handleGenerateOutline(payload, headers, context);

            // (TODO sau) Action để lấy trạng thái các bài đã làm cho papers.html
            // case 'get_all_user_paper_statuses':
            //     if (event.httpMethod !== 'GET') return methodNotAllowed(headers, 'GET');
            //     return await handleGetAllUserPaperStatuses(userId, headers, context);

            default:
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action or missing action parameter.' }) };
        }

    } catch (error) {
        console.error('Unhandled error in Netlify function:', error.message, "\nStack:", error.stack);
        // Hiển thị lỗi chi tiết hơn nếu là môi trường dev (local hoặc Netlify dev context)
        const isDevelopment = process.env.NETLIFY_DEV || (context && context.clientContext && context.clientContext.env && context.clientContext.env.CONTEXT === 'dev');
        const errorMessage = isDevelopment ? error.message : 'An internal server error occurred.';
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error', details: errorMessage }) };
    }
};

function methodNotAllowed(headers, allowedMethod) {
    return { statusCode: 405, headers, body: JSON.stringify({ error: `Method Not Allowed. Use ${allowedMethod}.` }) };
}


// --- ACTION HANDLER IMPLEMENTATIONS ---

// context được truyền vào để có thể truy cập clientContext (ví dụ cho Netlify Identity) sau này
async function handleSubmitAttempt(payload, headers, context) {
    const { paperId, userId, answerText, fileUrl, fileName, timeSpent } = payload;

    if (!paperId || !userId || (!answerText && !fileUrl)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields (paperId, userId, and answerText or fileUrl).' }) };
    }

    let textToGrade = answerText || ""; // Đảm bảo textToGrade không phải undefined

    // TODO: Logic OCR cho fileUrl (nếu là ảnh/PDF) sẽ được thêm ở đây nếu cần.
    // Hiện tại, chúng ta giả định textToGrade đã có hoặc chỉ dựa vào answerText.
    // Nếu có fileUrl và đó là file text client đã đọc, thì answerText có thể là nội dung file đó.

    let gradingResult;
    try {
        console.log(`[User: ${userId}] Calling OpenAI for paper: ${paperId}, time: ${timeSpent}s`);
        gradingResult = await gradeWithOpenAI(paperId, textToGrade, timeSpent);
    } catch (aiError) {
        console.error(`[User: ${userId}] AI Grading Error for paper ${paperId}:`, aiError.message);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'AI grading failed.', details: aiError.message }) };
    }

    const attemptId = `${userId}_${paperId.replace(/[^a-zA-Z0-9-]/g, '')}_${Date.now()}`;
    const attemptData = {
        attemptId,
        paperId,
        userId, // Lưu userId để query sau này
        answerText: textToGrade,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        timeSpent: parseInt(timeSpent, 10) || 0,
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...gradingResult
    };

    try {
        // Lưu vào Firestore: users/{userId}/attempts/{attemptId}
        // Hoặc một collection gốc: attempts/{attemptId} (nếu muốn query dễ hơn không cần userId)
        // Hiện tại dùng cấu trúc lồng:
        await db.collection('users').doc(userId).collection('attempts').doc(attemptId).set(attemptData);
        console.log(`[User: ${userId}] Attempt ${attemptId} for paper ${paperId} saved to Firestore.`);
    } catch (dbError) {
        console.error(`[User: ${userId}] Firestore save error for attempt ${attemptId}:`, dbError.message);
        // Không nên trả về lỗi DB chi tiết cho client ở production
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to save attempt data.' }) };
    }

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            message: 'Attempt submitted and graded successfully.',
            ...attemptData // Trả về toàn bộ dữ liệu, client có thể dùng ngay
        }),
    };
}

async function handleDeleteAttempt(payload, headers, context) {
    const { attemptId, userId, paperId } = payload; // paperId tùy chọn, để client có thể cập nhật UI
    // QUAN TRỌNG: Xác thực người dùng!
    // const clientContext = context.clientContext;
    // if (!clientContext || !clientContext.user || clientContext.user.sub !== userId) {
    //     console.warn(`[Attempt Delete] Unauthorized attempt by alleged user ${userId} for attempt ${attemptId}. Netlify user context:`, clientContext?.user);
    //     return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden. You can only delete your own attempts.' })};
    // }
    // Bỏ qua xác thực nâng cao cho "no code" user, nhưng đây là điểm cần lưu ý cho production.

    if (!attemptId || !userId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing attemptId or userId for deletion.' }) };
    }

    try {
        const attemptRef = db.collection('users').doc(userId).collection('attempts').doc(attemptId);
        const doc = await attemptRef.get();

        if (!doc.exists) {
            console.log(`[User: ${userId}] Attempt ${attemptId} not found for deletion.`);
            return { statusCode: 404, headers, body: JSON.stringify({ error: `Attempt ${attemptId} not found.` }) };
        }

        await attemptRef.delete();
        console.log(`[User: ${userId}] Attempt ${attemptId} deleted from Firestore.`);
        // TODO: Nếu cần, cập nhật trạng thái của paper liên quan (đánh dấu là 'not_done') trong một collection khác hoặc một field của user.
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: `Attempt ${attemptId} deleted.`,
                deletedAttemptId: attemptId,
                relatedPaperId: paperId // Gửi lại để client dễ cập nhật UI
            }),
        };
    } catch (dbError) {
        console.error(`[User: ${userId}] Firestore delete error for attempt ${attemptId}:`, dbError.message);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to delete attempt.' }) };
    }
}

async function handleGetAttemptDetails(attemptId, userId, headers, context) {
    // QUAN TRỌNG: Xác thực người dùng (tương tự handleDeleteAttempt)
    // const clientContext = context.clientContext;
    // if (!clientContext || !clientContext.user || clientContext.user.sub !== userId) {
    //     return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden. You can only view your own attempts.' })};
    // }
    if (!attemptId || !userId) { // Kiểm tra lại cho chắc
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing attemptId or userId.' }) };
    }

    try {
        const attemptRef = db.collection('users').doc(userId).collection('attempts').doc(attemptId);
        const doc = await attemptRef.get();

        if (!doc.exists) {
            console.log(`[User: ${userId}] Attempt ${attemptId} not found for getDetails.`);
            return { statusCode: 404, headers, body: JSON.stringify({ error: `Attempt ${attemptId} not found.` }) };
        }
        const attemptData = doc.data();
        // Chuyển đổi Firestore Timestamp thành dạng client dễ đọc nếu cần
        if (attemptData.submittedAt && typeof attemptData.submittedAt.toDate === 'function') {
            attemptData.submittedAtISO = attemptData.submittedAt.toDate().toISOString();
        }
        console.log(`[User: ${userId}] Retrieved details for attempt ${attemptId}.`);
        return { statusCode: 200, headers, body: JSON.stringify(attemptData) };
    } catch (dbError) {
        console.error(`[User: ${userId}] Firestore get error for attempt ${attemptId}:`, dbError.message);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to retrieve attempt details.' }) };
    }
}

async function handleGenerateOutline(payload, headers, context) {
    const { paperId, questionText, userId } = payload;
    // userId có thể dùng để cá nhân hóa hoặc lưu trữ outline theo user

    if (!paperId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing paperId for outline generation.' }) };
    }

    try {
        const prompt = `Generate a detailed essay outline for an A-Level paper with ID ${paperId}.
        ${questionText ? `The specific question or context is: "${questionText}"` : "Focus on common themes and structure for this paper type."}
        The outline should be structured clearly with main sections (e.g., Introduction, Section A, Section B, Conclusion), sub-points using bullet points or numbered lists, and suggestions for examples, evidence, or key concepts to include where applicable.
        The tone should be academic and helpful for a student preparing for an exam.
        Return the outline as a plain text string, formatted with markdown for readability (e.g., using # for headings, * or - for bullet points). Aim for a comprehensive outline.`;

        console.log(`[User: ${userId || 'Guest'}] Calling OpenAI for outline generation, paper: ${paperId}`);
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Hoặc "gpt-4" nếu bạn có quyền truy cập và muốn chất lượng cao hơn
            messages: [
                { role: "system", content: "You are an expert A-Level tutor specializing in essay planning and structure." },
                { role: "user", content: prompt }
            ],
            temperature: 0.5,
        });

        const outlineText = completion.choices[0].message.content;
        console.log(`[User: ${userId || 'Guest'}] Outline generated for paper ${paperId}.`);

        // TODO: Tùy chọn: Lưu outline này vào Firestore nếu cần
        // if (userId && db) {
        //    const outlineDocId = `${userId}_${paperId}_outline_${Date.now()}`;
        //    await db.collection('users').doc(userId).collection('generated_outlines').doc(outlineDocId).set({
        //        paperId, questionText: questionText || null, outline: outlineText,
        //        createdAt: admin.firestore.FieldValue.serverTimestamp()
        //    });
        // }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, paperId, outline: outlineText }),
        };

    } catch (aiError) {
        console.error(`[User: ${userId || 'Guest'}] AI Outline Generation Error for paper ${paperId}:`, aiError.message);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'AI outline generation failed.', details: aiError.message }) };
    }
}

// --- HELPER: OpenAI Interaction ---
async function gradeWithOpenAI(paperId, answerText, timeSpent) {
    if (!openai) {
        throw new Error("OpenAI client not initialized. Cannot grade.");
    }
    if (!answerText || answerText.trim() === "") {
        console.log(`[OpenAI Grade] No answer text provided for paper ${paperId}. Returning default 'U' grade.`);
        return {
            score: 0, grade: 'U', feedback: "No answer was provided for grading.",
            sectionScores: { sectionA: "0/20", sectionB: "0/20", sectionC: "0/20" }, // Hoặc N/A tùy paper
            outline: "No answer submitted. A specific outline cannot be generated for this attempt."
        };
    }

    const systemPrompt = `You are an A-Level exam marker.
    You will be given the student's answer, the paper ID (e.g., econ-9708-11-mj-25 or biz-9609-21-fm-25), and the time they spent.
    Provide the following in a VALID JSON object format, with all fields populated:
    1.  "score": An integer score out of 60.
    2.  "grade": A single uppercase letter grade (A, B, C, D, E, or U).
    3.  "feedback": Constructive, detailed feedback on the student's answer, referencing specific parts of their text. Minimum 100 words.
    4.  "sectionScores": An object.
        - If the paper ID suggests multiple sections (e.g., paper number 2 or 4 like "econ-9708-22" or "biz-9609-41"), provide scores for "sectionA", "sectionB", "sectionC" (if a third section is typical for that paper type). Each section score should be a string like "15/20". If a section is not applicable, use "N/A".
        - If the paper ID suggests a single essay (e.g., paper number 1 or 3 like "econ-9708-11" or "biz-9609-32"), set "sectionA": "N/A", "sectionB": "N/A", "sectionC": "N/A".
    5.  "outline": A model essay outline relevant to the paper and the student's answer, suggesting improvements or a better structure. Minimum 70 words. Structure it with markdown for readability.

    Base your grading on typical A-Level standards.
    - Economics papers are 'econ-9708-XX-XX-XX'.
    - Business papers are 'biz-9609-XX-XX-XX'.
    Tailor feedback, section score applicability, and outline accordingly.
    Be critical but fair. If the answer is very poor, reflect that in the score and grade.
    Ensure the output is ONLY the JSON object.`;

    const userPrompt = `Paper ID: ${paperId}
Time Spent: ${timeSpent || 'Not specified'} seconds
Student's Answer:
---
${answerText}
---`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125", // Model này hỗ trợ JSON mode tốt
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            // max_tokens: 1000, // Giới hạn token nếu cần
        });

        const content = completion.choices[0].message.content;
        if (!content) {
            throw new Error("OpenAI returned an empty content string.");
        }
        // console.log("[OpenAI Grade] Raw Response:", content); // Bật để debug
        try {
            const parsedJson = JSON.parse(content);
            // Validate cấu trúc JSON cơ bản
            if (typeof parsedJson.score !== 'number' || typeof parsedJson.grade !== 'string' || typeof parsedJson.feedback !== 'string' || typeof parsedJson.sectionScores !== 'object' || typeof parsedJson.outline !== 'string') {
                console.error("[OpenAI Grade] Parsed JSON has missing/invalid fields. Raw:", content);
                throw new Error("AI returned JSON with missing/invalid fields.");
            }
            return parsedJson;
        } catch (parseError) {
            console.error("[OpenAI Grade] Failed to parse OpenAI JSON response:", parseError.message, "\nRaw content:", content);
            throw new Error("AI returned an invalid JSON format. Content: " + content.substring(0, 200) + "...");
        }
    } catch (error) {
        console.error("[OpenAI Grade] Error calling OpenAI API:", error.message);
        if (error.response && error.response.data) { // Lỗi chi tiết từ API của OpenAI
            console.error("[OpenAI Grade] OpenAI API Error Data:", error.response.data);
        }
        throw error;
    }
}