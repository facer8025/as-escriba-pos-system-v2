# ========================================================================
# Build stage
# ========================================================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

ARG CACHE_BUST
RUN echo "Build number: ${CACHE_BUST}"

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# ========================================================================
# Runtime stage
# ========================================================================
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -S escriba && adduser -S escriba -G escriba

COPY --from=build /app/target/*.jar app.jar

RUN chown -R escriba:escriba /app

USER escriba

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD curl -f http://localhost:8080/api/v1/actuator/health || exit 1

ENTRYPOINT ["java", \
    "-XX:+UseZGC", \
    "-XX:ZCollectionInterval=30", \
    "-XX:+UseStringDeduplication", \
    "-XX:+OptimizeStringConcat", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
