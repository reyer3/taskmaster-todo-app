/**
 * Servicio de correo electrónico para TaskMaster
 *
 * Encapsula la funcionalidad de envío de emails con diferentes tipos
 * de plantillas y configuraciones según el entorno.
 */

const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
// --- CORRECCIÓN DE IMPORTACIÓN ---
// Extrae específicamente la clase AppError del objeto exportado
const { AppError } = require('../utils/errors/app-error');

/**
 * Determina si la aplicación está en entorno de producción
 * @returns {boolean} true si está en producción
 */
const isProduction = () => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'production';
};

class EmailService {
    constructor() {
        this.transporter = null;
        this.templatesCache = {};
        this.from = process.env.EMAIL_FROM || '"TaskMaster App" <noreply@taskmaster.com>';
        this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        this.initialized = false;
    }

    /**
     * Inicializa el transporte de correo de forma lazy
     * @returns {Promise<void>}
     */
    async ensureInitialized() {
        if (this.initialized) return;

        try {
            if (isProduction()) {
                // Configuración para producción (SMTP)
                this.transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST,
                    port: parseInt(process.env.EMAIL_PORT || '587', 10),
                    secure: process.env.EMAIL_SECURE === 'true',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD,
                    },
                });

                console.log('Servicio de email inicializado en modo PRODUCCIÓN');
            } else {
                // En desarrollo usamos ethereal.email (correos de prueba)
                await this.createTestAccount();
                console.log('Servicio de email inicializado en modo DESARROLLO');
            }

            this.initialized = true;
        } catch (error) {
            console.error('Error al inicializar servicio de email:', error);
            // --- CORRECCIÓN: Añadir 'new' ---
            throw new AppError('No se pudo inicializar el servicio de email', 500);
        }
    }

    /**
     * Crea una cuenta de prueba para desarrollo
     * @returns {Promise<void>}
     */
    async createTestAccount() {
        try {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log('Cuenta de prueba para emails creada:', testAccount.user);
        } catch (error) {
            console.error('Error al crear cuenta de prueba para emails:', error);
            // --- CORRECCIÓN: Añadir 'new' ---
            throw new AppError('No se pudo crear cuenta de prueba para emails', 500);
        }
    }

    /**
     * Carga una plantilla o la obtiene de caché.
     * Las plantillas compiladas son funciones que aceptan un contexto y devuelven HTML.
     * @param {string} templateName - Nombre de la plantilla (sin extensión .hbs)
     * @returns {Promise<Handlebars.TemplateDelegate<any>>} Una promesa que resuelve con la plantilla Handlebars
     */
    async getTemplate(templateName) {
        // Verificar si la plantilla ya está en caché
        if (this.templatesCache[templateName]) {
            return this.templatesCache[templateName];
        }

        try {
            // Cargar la plantilla desde el sistema de archivos
            const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
            const templateSource = await fs.readFile(templatePath, 'utf-8');

            // Compilar y guardar en caché
            const template = handlebars.compile(templateSource);
            this.templatesCache[templateName] = template;

            return template;
        } catch (error) {
            console.error(`Error al cargar plantilla ${templateName}:`, error);
            // --- CORRECCIÓN: Añadir 'new' ---
            throw new AppError(`No se pudo cargar la plantilla ${templateName}`, 500);
        }
    }

    /**
     * Versión simplificada de HTML a texto
     * @param {string} html - HTML a convertir
     * @returns {string} - Texto plano
     */
    htmlToText(html) {
        // (El contenido de esta función está bien)
        return html
            .replace(/<style[^>]*>.*?<\/style>/gs, '')
            .replace(/<script[^>]*>.*?<\/script>/gs, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    /**
     * Envía un correo electrónico
     * @param {Object} options - Opciones de envío
     * @returns {Promise<object>} Información del envío
     */
    async sendEmail(options) {
        try {
            await this.ensureInitialized();

            const { to, subject, template, context } = options;

            // Añadir año actual al contexto
            const enrichedContext = {
                ...context,
                year: new Date().getFullYear()
            };

            // Obtener y compilar la plantilla
            const compiledTemplate = await this.getTemplate(template);
            const html = compiledTemplate(enrichedContext);

            // Configurar mensaje
            const message = {
                from: this.from,
                to,
                subject,
                html,
                text: this.htmlToText(html)
            };

            // Enviar email
            const info = await this.transporter.sendMail(message);

            // En desarrollo, mostrar URL de previsualización
            if (!isProduction() && info && nodemailer.getTestMessageUrl) {
                const previewUrl = nodemailer.getTestMessageUrl(info);
                if (previewUrl) { // Asegurarse de que la URL existe
                    console.log('URL de previsualización:', previewUrl);
                }
            }

            return info;
        } catch (error) {
            console.error('Error al enviar email:', error);
            // Si el error ya es un AppError (lanzado desde getTemplate, por ej.), relanzarlo.
            if (error instanceof AppError) {
                throw error;
            }
            // Si es otro tipo de error, envolverlo en un AppError.
            // --- CORRECCIÓN: Añadir 'new' ---
            throw new AppError(`Error al enviar email: ${error.message || error}`, 500);
        }
    }

    // --- Los métodos sendWelcomeEmail, sendPasswordResetEmail, etc., están bien ---
    // porque llaman a this.sendEmail, que ya maneja los errores correctamente.
    async sendWelcomeEmail(user) {
        return this.sendEmail({
            to: user.email,
            subject: '¡Bienvenido a TaskMaster!',
            template: 'welcome',
            context: {
                name: user.name,
                loginUrl: `${this.baseUrl}/login`
            }
        });
    }

    async sendPasswordResetEmail(user, token) {
        return this.sendEmail({
            to: user.email,
            subject: 'Restablecimiento de contraseña',
            template: 'password-reset',
            context: {
                name: user.name,
                resetUrl: `${this.baseUrl}/reset-password?token=${token}`,
                expiryTime: '1 hora'
            }
        });
    }

    async sendTaskReminderEmail(user, task) {
        return this.sendEmail({
            to: user.email,
            subject: `Recordatorio: ${task.title}`,
            template: 'task-reminder',
            context: {
                name: user.name,
                taskTitle: task.title,
                taskDescription: task.description || '',
                dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No definida',
                taskUrl: `${this.baseUrl}/tasks/${task.id}`
            }
        });
    }

    async sendWeeklyReportEmail(user, stats) {
        // Asegúrate de que las fechas existan antes de llamar a toLocaleDateString
        const weekStartDateString = stats.weekStart ? stats.weekStart.toLocaleDateString() : 'N/A';
        const weekEndDateString = stats.weekEnd ? stats.weekEnd.toLocaleDateString() : 'N/A';

        return this.sendEmail({
            to: user.email,
            subject: 'Tu reporte semanal de tareas',
            template: 'weekly-report',
            context: {
                name: user.name,
                completed: stats.completed || 0,
                pending: stats.pending || 0,
                overdue: stats.overdue || 0,
                dashboardUrl: `${this.baseUrl}/dashboard`,
                weekStart: weekStartDateString,
                weekEnd: weekEndDateString
            }
        });
    }
}

// Exportar una instancia singleton
const emailService = new EmailService();

module.exports = emailService;

// Para asegurar que los métodos se consideren utilizados, exportamos también métodos individuales
module.exports.sendWelcomeEmail = (user) => emailService.sendWelcomeEmail(user);
module.exports.sendPasswordResetEmail = (user, token) => emailService.sendPasswordResetEmail(user, token);
module.exports.sendTaskReminderEmail = (user, task) => emailService.sendTaskReminderEmail(user, task);
module.exports.sendWeeklyReportEmail = (user, stats) => emailService.sendWeeklyReportEmail(user, stats);