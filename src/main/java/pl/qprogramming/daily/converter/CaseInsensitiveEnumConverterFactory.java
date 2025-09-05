package pl.qprogramming.daily.converter;

import org.springframework.core.convert.converter.Converter;
import org.springframework.core.convert.converter.ConverterFactory;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class CaseInsensitiveEnumConverterFactory implements ConverterFactory<String, Enum> {

    @Override
    public <T extends Enum> Converter<String, T> getConverter(Class<T> targetType) {
        return new CaseInsensitiveEnumConverter<>(targetType);
    }

    private static final class CaseInsensitiveEnumConverter<T extends Enum<T>> implements Converter<String, T> {
        private final Class<T> targetType;
        private final Map<String, T> lookup = new HashMap<>();
        private final Method fromValueMethod;
        private final Method jsonValueMethod;

        CaseInsensitiveEnumConverter(Class<T> targetType) {
            this.targetType = targetType;

            for (T e : targetType.getEnumConstants()) {
                lookup.put(e.name().toLowerCase(Locale.ROOT), e);
            }

            this.jsonValueMethod = findJsonValueOrGetValue(targetType);
            if (jsonValueMethod != null) {
                for (T e : targetType.getEnumConstants()) {
                    try {
                        Object v = jsonValueMethod.invoke(e);
                        if (v != null) {
                            lookup.put(v.toString().toLowerCase(Locale.ROOT), e);
                        }
                    } catch (ReflectiveOperationException ignored) {
                    }
                }
            }

            this.fromValueMethod = findFromValue(targetType);
        }

        @Override
        public T convert(String source) {
            if (source == null) return null;
            String key = source.trim();
            if (key.isEmpty()) return null;

            T hit = lookup.get(key.toLowerCase(Locale.ROOT));
            if (hit != null) return hit;

            if (fromValueMethod != null) {
                try {
                    @SuppressWarnings("unchecked")
                    T v = (T) fromValueMethod.invoke(null, key);
                    if (v != null) return v;
                } catch (ReflectiveOperationException ignored) {
                }
                try {
                    @SuppressWarnings("unchecked")
                    T v = (T) fromValueMethod.invoke(null, key.toLowerCase(Locale.ROOT));
                    if (v != null) return v;
                } catch (ReflectiveOperationException ignored) {
                }
            }

            try {
                return Enum.valueOf(targetType, key.toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Unknown value '" + source + "' for enum " + targetType.getSimpleName());
            }
        }

        private static Method findFromValue(Class<?> type) {
            try {
                Method m = type.getDeclaredMethod("fromValue", String.class);
                if (Modifier.isStatic(m.getModifiers())) {
                    m.setAccessible(true);
                    return m;
                }
            } catch (NoSuchMethodException ignored) {
            }
            return null;
        }

        private static Method findJsonValueOrGetValue(Class<?> type) {
            for (Method m : type.getDeclaredMethods()) {
                if (m.getParameterCount() == 0 &&
                        java.util.Arrays.stream(m.getAnnotations())
                                .anyMatch(a -> a.annotationType().getName()
                                        .equals("com.fasterxml.jackson.annotation.JsonValue"))) {
                    m.setAccessible(true);
                    return m;
                }
            }
            try {
                Method m = type.getDeclaredMethod("getValue");
                if (m.getParameterCount() == 0) {
                    m.setAccessible(true);
                    return m;
                }
            } catch (NoSuchMethodException ignored) {
            }
            return null;
        }
    }
}
