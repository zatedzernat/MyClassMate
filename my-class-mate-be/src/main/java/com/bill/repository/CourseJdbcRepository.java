package com.bill.repository;

import com.bill.repository.entity.Course;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.StringJoiner;

@Repository
public class CourseJdbcRepository {
    @Autowired
    NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    public List<Course> findCourses(Integer academicYear, Integer semester) {
        var sql = new StringJoiner(" ");
        var param = new MapSqlParameterSource();
        sql.add("select * from courses where 1 = 1");

        if (academicYear != null) {
            sql.add("and academic_year = :academicYear");
            param.addValue("academicYear", academicYear);
        }

        if (semester != null) {
            sql.add("and semester = :semester");
            param.addValue("semester", semester);
        }


        return namedParameterJdbcTemplate.query(sql.toString(), param, new BeanPropertyRowMapper<>(Course.class));
    }
}
