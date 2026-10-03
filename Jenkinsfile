pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 45, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        SONAR_PROJECT_KEY = 'EntreAulas_Front'
        SONAR_PROJECT_NAME = 'EntreAulas Front'
        IMAGE_NAME = 'entreaulas-front'
        CONTAINER_NAME = 'entreaulas-front-container'
        VERCEL_URL = 'https://entre-aulas-front.vercel.app'
    }

    stages {
        stage('Verify Environment') {
            steps {
                sh '''
                    set -e
                    docker --version
                    java -version
                    docker run --rm node:22-bookworm-slim node --version
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    set -e
                    docker run --rm \
                        --user "$(id -u):$(id -g)" \
                        -e HOME=/tmp \
                        -v jenkins_home:/var/jenkins_home \
                        -w "$WORKSPACE" \
                        node:22-bookworm-slim \
                        npm ci --legacy-peer-deps
                '''
            }
        }

        stage('Tests') {
            steps {
                sh '''
                    set -e
                    docker run --rm \
                        --user "$(id -u):$(id -g)" \
                        -e HOME=/tmp \
                        -v jenkins_home:/var/jenkins_home \
                        -w "$WORKSPACE" \
                        node:22-bookworm-slim \
                        npm run test:coverage -- \
                            --reporter=default \
                            --reporter=junit \
                            --outputFile.junit=test-results.xml
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool(
                        name: 'SonarScanner',
                        type: 'hudson.plugins.sonar.SonarRunnerInstallation'
                    )

                    withSonarQubeEnv('SonarQube') {
                        sh """
                            set -e
                            "${scannerHome}/bin/sonar-scanner"
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    set -e
                    docker build \
                        --build-arg VITE_API_URL=http://localhost:3000 \
                        -t "$IMAGE_NAME:$BUILD_NUMBER" \
                        -t "$IMAGE_NAME:latest" \
                        .
                '''
            }
        }

        stage('Deploy Application') {
            steps {
                sh '''
                    set -e

                    docker rm -f "$CONTAINER_NAME" \
                        2>/dev/null || true

                    docker run -d \
                        --name "$CONTAINER_NAME" \
                        --restart unless-stopped \
                        -p 3001:80 \
                        "$IMAGE_NAME:$BUILD_NUMBER"
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    set -e

                    for attempt in $(seq 1 12); do
                        HEALTH_STATUS=$(docker inspect \
                            --format='{{.State.Health.Status}}' \
                            "$CONTAINER_NAME" \
                            2>/dev/null || true)

                        echo "Estado: $HEALTH_STATUS"

                        if [ "$HEALTH_STATUS" = "healthy" ]; then
                            exit 0
                        fi

                        if [ "$HEALTH_STATUS" = "unhealthy" ]; then
                            docker logs "$CONTAINER_NAME"
                            exit 1
                        fi

                        sleep 5
                    done

                    docker logs "$CONTAINER_NAME"
                    echo "El contenedor no alcanzo el estado healthy."
                    exit 1
                '''
            }
        }

        stage('Deploy to Vercel') {
            steps {
                withCredentials([string(credentialsId: 'vercel-deploy-hook-front', variable: 'VERCEL_HOOK')]) {
                    sh '''
                        set -e
                        curl -fsS -X POST "$VERCEL_HOOK" -o /dev/null
                        echo "Despliegue solicitado a Vercel para el commit $GIT_COMMIT"
                    '''
                }
            }
        }

        stage('Verify Vercel') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    sh '''
                        set -e
                        for attempt in $(seq 1 40); do
                            RESPONSE=$(curl -fsS --max-time 30 "$VERCEL_URL/version.json" || true)
                            echo "Intento $attempt: $RESPONSE"

                            if echo "$RESPONSE" | grep -q "$GIT_COMMIT"; then
                                echo "Vercel ya sirve el commit $GIT_COMMIT"
                                exit 0
                            fi

                            sleep 15
                        done

                        echo "Vercel no publico el commit $GIT_COMMIT a tiempo."
                        exit 1
                    '''
                }
            }
        }
    }

    post {
        always {
            junit(
                testResults: 'test-results.xml',
                allowEmptyResults: true
            )

            archiveArtifacts(
                artifacts: [
                    'coverage/lcov.info',
                    'test-results.xml'
                ].join(','),
                fingerprint: true,
                allowEmptyArchive: true
            )
        }

        failure {
            sh '''
                docker logs "$CONTAINER_NAME" \
                    2>/dev/null || true
            '''
        }
    }
}
