--for report or visualization
WITH participation_summary AS (
    SELECT
        ps.course_schedule_id,
        pr.student_id,
        COUNT(pr.id) AS total_participations,
        SUM(pr.score)  AS total_scores
    FROM participation_requests pr
    JOIN participations ps ON pr.participation_id = ps.id
    GROUP BY ps.course_schedule_id, pr.student_id
)
SELECT
    ROW_NUMBER() OVER (ORDER BY c.course_code, cs.schedule_date, u.name_en) AS id,
    c.course_code,
    c.course_name,
    cs.schedule_date,
    cs.start_time,
    cs.end_time,
    sp.student_no,
    CONCAT(u.name_en, ' ', LEFT(u.surname_en, 1), '.') AS student_name,
    COALESCE(a.status, 'ABSENT') AS status,
    CASE
      WHEN COALESCE(a.status, 'ABSENT') = 'ABSENT'
        THEN (cs.schedule_date::timestamp + time '23:00:00')
      ELSE (a.created_at)
    END AS attended_at,
    COALESCE(p.total_participations, 0) AS total_participations,
    COALESCE(p.total_scores, 0) AS total_scores
FROM course_schedules cs
JOIN courses c ON cs.course_id = c.id
JOIN enrollments e ON e.course_id  = c.id
JOIN users u ON u.id = e.student_id
JOIN student_profiles sp ON u.id = sp.student_id
LEFT JOIN attendances a ON a.course_schedule_id = cs.id AND a.student_id = u.id
LEFT JOIN participation_summary p ON p.course_schedule_id = cs.id AND p.student_id = u.id
ORDER BY c.course_code, cs.schedule_date, student_name;