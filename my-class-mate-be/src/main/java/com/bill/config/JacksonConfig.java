package com.bill.config;

import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalTimeSerializer;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.format.DateTimeFormatter;
import java.util.TimeZone;

@Configuration
public class JacksonConfig {

    private static final String DATE_FORMAT = "yyyy-MM-dd";
    private static final String DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";
    private static final String TIME_FORMAT = "HH:mm:ss";

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jsonCustomizer() {
        return builder -> {
            builder.timeZone(TimeZone.getTimeZone("Asia/Bangkok"));
            builder.serializers(
                    new LocalDateSerializer(DateTimeFormatter.ofPattern(DATE_FORMAT)),
                    new LocalDateTimeSerializer(DateTimeFormatter.ofPattern(DATETIME_FORMAT)),
                    new LocalTimeSerializer(DateTimeFormatter.ofPattern(TIME_FORMAT))
            );
            builder.deserializers(
                    new LocalDateDeserializer(DateTimeFormatter.ofPattern(DATE_FORMAT)),
                    new LocalDateTimeDeserializer(DateTimeFormatter.ofPattern(DATETIME_FORMAT)),
                    new LocalTimeDeserializer(DateTimeFormatter.ofPattern(TIME_FORMAT))
            );
        };
    }
}
